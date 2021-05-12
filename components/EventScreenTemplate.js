/* eslint-disable react/display-name */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
	StyleSheet,
	View,
	Share,
	Text,
	TouchableOpacity,
	ActivityIndicator,
	ImageBackground,
	FlatList,
	RefreshControl,
	Alert,
	Dimensions,
	Platform,
	InteractionManager
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from "@react-native-community/netinfo";
import useLocalStorage from '../hook/UseLocalStorage';
import * as Location from 'expo-location';
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from 'react-native-elements';
import Icon2 from 'react-native-vector-icons/MaterialCommunityIcons';
import * as SecureStore from 'expo-secure-store';
import LocationOffIcon from 'react-native-vector-icons/MaterialIcons';
import GetApiData from '../api/GetApiListData';
import ApiFavorites from '../api/ApiFavorites';
import ReportError from '../api/ReportError';
import ErrorMessage from './ErrorMessage';
import RetryIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackActions } from '@react-navigation/native';

const keyExtractor = item => item.Id;

export default function EventScreenTemplate({ route }) {
	let params = route.params
	const navigation = useNavigation();
	const [isBusy, setIsBusy] = useState(false);
	const [dataSource, setDataSource] = useState([]);
	const [favorite, setFavorite] = useState([]);
	const [Loading, setLoading] = useState(true);
	const [getUserLocation, setUserLocation] = useState('');
	const [refreshing, setRefreshing] = useState(false);
	const [isOffline, setIsOffline] = useState(false);
	const [isCachedData, setIsCachedData] = useState(false);
	const [hasFailed, setHasFailed] = useState(false);
	const [isFirstLoaded, setIsFirstLoaded] = useState(false);
	const getLocalFilterValue = useLocalStorage('filterValue');

	const filterValue = useRef(params.initFilterValue)
	const flatListRef = useRef(null)

	useFocusEffect(
		useCallback(() => {
			const task = InteractionManager.runAfterInteractions(async () => {
				let localFilterValue = await getLocalFilterValue;
				if (localFilterValue !== null && localFilterValue !== filterValue.current && filterValue.current !== null) {
					filterValue.current = localFilterValue;
					_onRefresh();
					_getScreenData();
				}
			});

			return () => task.cancel();
		}, [getLocalFilterValue])
	);

	function _filterOnDistanceFunction(filteredList, newData) {
		if (
			filterValue.current > 0 &&
			filterValue.current < 100 &&
			params.screen !== 'PopularEvents'
		) {
			if (newData) {
				const newData = filteredList.filter(item => {
					if (item.Geenadres == '1' || item.Type == 'ad') {
						return true;
					} else {
						const itemDistance = item.distance;
						return itemDistance < filterValue.current;
					}
				});
				setDataSource(newData)
				setLoading(false)
			} else {
				_getScreenData()
			}
		} else {
			if (newData) {
				setDataSource(filteredList)
				setLoading(false)
			} else {
				_getScreenData()
			}
		}

	}

	useEffect(() => {
		function init() {
			if (!isBusy && !isFirstLoaded) {
				setIsBusy(true)
				setIsFirstLoaded(true)
				try {
					SecureStore.getItemAsync('userData').then(async data => {
						let userID = JSON.parse(data);
						if (userID == null || userID == '-1' || userID == '0') {
							Alert.alert(
								'Oops',
								'We hebben een fout ontdekt, om dit te verhelpen moet er opnieuw ingelogd worden.'
							);
							SecureStore.deleteItemAsync('userData').then(() => {
								AsyncStorage.removeItem('Favorites');
								AsyncStorage.removeItem('filterValue');
								AsyncStorage.removeItem('userLocation');
							});
							ReportError._reportError(
								3090,
								'EventScreenTemplate 154, fout ondekt opnieuw inloggen UserID waarschijnlijk leeg: ' +
								userID
							);
							navigation.dispatch(
								StackActions.replace('AuthCheck')
							);
						} else {
							_getUserLocation();
						}
					});
				} catch (error) {
					console.log(error);
					ReportError._reportError(
						4000,
						error + ' eventscreentemplate 164'
					);
				}
			}
		}
		init();

		async function _getUserLocation() {
			try {
				let UserLocation = await AsyncStorage.getItem('userLocation');
				UserLocation = JSON.parse(UserLocation);
				if (UserLocation) {
					setUserLocation(UserLocation)
					setRefreshing(false);
				} else {
					if (Platform.OS === 'ios') {
						setUserLocation(null)
						setRefreshing(false);
					} else {
						_retryGettingLocation();
					}
				}
			} catch (error) {
				ReportError._reportError(170, error.toString());
			}
		}

		let unsubscribe = NetInfo.addEventListener(
			handleFirstConnectivityChange
		);

		return function () {
			unsubscribe();
		}
	}, []);

	useFocusEffect(
		React.useCallback(() => {
			if (!isBusy && isFirstLoaded) {
				_getFavoriteListDB();
				if (params.screen === 'AllFavorites') {
					_getScreenData();
				}
			}
		}, [isBusy, isFirstLoaded])
	);

	useEffect(() => {
		_initHandlers();

		function _initHandlers() {
			NetInfo.fetch().then(state => {
				if (state.type === 'none') {
					setIsOffline(true)
				} else {
					setIsOffline(false)
				}
			});
		}

	}, [])

	useEffect(() => {
		try {
			if (Object.values(getUserLocation).length > 0) {
				_getScreenData();
				_getFavoriteListDB();
				setIsBusy(false)
			}
		} catch (error) {
			_getScreenData();
			_getFavoriteListDB();
			setIsBusy(false)
		}
	}, [getUserLocation])

	useEffect(() => {
		if (dataSource.length > 0) {
			if (flatListRef.current && refreshing && !isFirstLoaded) {
				console.log('refreshing, scrolling to top...')
				flatListRef.current.scrollToIndex({ animated: true, index: 0 })
				setRefreshing(false)
			}
		}
	}, [dataSource])

	async function handleFirstConnectivityChange(status) {
		if (status.isInternetReachable && isOffline) {
			setIsOffline(false)
			_onRefresh();
		} else if (!isOffline && !status.isInternetReachable && isFirstLoaded) {
			setLoading(false)
			setIsOffline(true)
		}
	}

	async function _retryGettingLocation() {
		console.log('retrying getting position')
		try {
			let currentposition = await Location.getLastKnownPositionAsync();
			AsyncStorage.setItem(
				'userLocation',
				JSON.stringify(currentposition)
			);
			_getScreenData();
			_getFavoriteListDB();
		} catch (error) {
			console.log(error);
			ReportError._reportError(150, error.toString());
		}
	}

	async function _getFavoriteListDB() {
		let favoriteList = await ApiFavorites._getAllFavorites();
		if (favoriteList !== '0') {
			if (favoriteList) {
				setFavorite(favoriteList);
			}
		} else {
			console.log('niks')
			setFavorite([''])
		}
	}

	async function _resetFilter() {
		console.log('resetfilter')
		await AsyncStorage.setItem('filterValue', JSON.stringify('100'));
		_onRefresh();
	}

	async function _getScreenData() {
		let screenList;
		if (params.screen === 'AllFavorites') {
			screenList = await ApiFavorites._getFavoriteScreenItems(params.screen);
			if (screenList === '0') {
				setHasFailed(true)
			}
		} else {
			if (params.themeScreen === 1) {
				screenList = await GetApiData._getThemeListData(params.tabInfo);
			} else {
				screenList = await GetApiData._getItemListData(params.screen);
			}
		}
		setIsOffline(false)
		if (screenList[0] == 'leeg' || screenList == 'leeg') {
			setLoading(false)
			setDataSource('leeg')
		} else if (screenList === '0') {
			setLoading(false)
			setHasFailed(true)
		} else {
			if (screenList[1] == 2) {
				setIsCachedData(true)
			} else {
				setIsCachedData(false)
			}
			if (screenList[0].length > 0) {
				_calculateDistance(screenList[0]);
			} else {
				_calculateDistance(screenList);
			}
		}
	}

	async function _calculateDistance(itemList) {
		let tempItemList = itemList;
		for (let index = 0; index < Object.keys(itemList).length; index++) {
			if (getUserLocation !== null && getUserLocation.length !== 0) {
				let distance = _calculateDistanceTwoPoints(
					getUserLocation.coords.latitude,
					getUserLocation.coords.longitude,
					itemList[index].Lat,
					itemList[index].Lng
				);
				if (isNaN(distance)) {
					tempItemList[index].distance = 0;
				} else {
					tempItemList[index].distance = distance;
				}
			} else {
				tempItemList[index].distance = 0;
			}
		}
		let filteredList = await tempItemList.filter(item => {
			return item.distance < 150 || item.Type == 'ad' || item.Geenadres == '1';
		});

		if (filteredList.length < 1) {
			setDataSource('noAreaItems');
			setLoading(false)
			setHasFailed(false)
			setRefreshing(false)
		} else {
			_filterOnDistanceFunction(filteredList, true)
			setLoading(false)
			setHasFailed(false)
			setRefreshing(false)
		}
	}

	function _OnShare(item) {
		let removedSpaces = item.Titel.split(' ').join('-');
		Share.share({
			title: item.Titel.trim(),
			message:
				'Check ' +
				item.Titel.trim() +
				' in de Representin app: ' +
				'https://www.representin.nl/app/' +
				removedSpaces +
				'?Id=' +
				item.Id
		});
	}

	function _openDetails(Id, Titel, Type) {
		if (isOffline) {
			alert('Je hebt helaas geen internet verbinding, controleer je internet.')
		} else {
			if (Type == 'events') {
				navigation.navigate(params.screen === 'AllFavorites' ? 'MoreScreenDetails' : 'Details', { Id, Titel: Titel, comesFromPaymentOverView: false })
				// navigation.navigate();
			} else if (Type == 'activities') {
				navigation.navigate(params.screen == 'AllFavorites' ? 'MoreScreenActivityDetails' : 'ActivityDetails', { Id, Titel: Titel, comesFromPaymentOverView: false });
			} else {
				navigation.navigate(params.screen == 'AllFavorites' ? 'MoreProductDetails' : 'ProductDetails', { Id, Titel: Titel, comesFromPaymentOverView: false });
			}
		}
	}

	function _onRefresh(screen) {
		if ((isOffline || dataSource == 'leeg' || dataSource == '') && screen == params.screen) {
			_getScreenData()
		} else {
			setRefreshing(true)
		}
	}

	function _updateAdClick(adID) {
		// eslint-disable-next-line no-undef
		fetch('https://representin.nl/api', {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json;charset=utf-8',
				'Access-Control-Allow-Origin': 'https://representin.nl/',
				'Access-Control-Allow-Methods': 'POST',
				'Access-Control-Max-Age': '3600',
				'Access-Control-Allow-Headers':
					'Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With'
			},
			body: JSON.stringify({
				action: 'updateAdClick',
				adID: adID
			})
		});
	}

	function renderSeperator() {
		return (
			<View
				style={{ height: 1, width: '100%', backgroundColor: 'white' }}
			/>
		);
	}

	function renderItem({ item }) {
		//advertisement
		let imageParams = '&height=520&quality=90'
		let adUri =
			'http://adminpanel.representin.nl/image.php?image=/advertenties/images/';
		if (item.Type == 'ad') {
			return (
				<React.Fragment>
					<TouchableOpacity
						id={item.Id}
						onPress={() => {
							if (item.Url.includes('http')) {
								_updateAdClick(item.Id);
								WebBrowser.openBrowserAsync(item.Url);
							} else if (item.SearchParam != '' && typeof item.SearchParam !== 'undefined') {
								navigation.navigate('Search', {
									shopSearch: false,
									SearchParam: item.SearchParam
								});
							} else {
								navigation.navigate(item.Url)
							}
						}}
						activeOpacity={0.9}
						style={{
							flex: 1,
							flexDirection: 'row',
							marginBottom: 1,
							backgroundColor: 'black',
							underlayColor: 'black'
						}}
					>
						<ImageBackground
							style={{
								width: '100%',
								height: 180,
								alignItems: 'flex-end'
							}}
							imageStyle={{
								resizeMode: 'stretch'
							}}
							source={{ uri: adUri + item.Foto + imageParams }}
						>
							{item.Uitlichten > 0 ? (
								<Text
									style={{
										fontSize: 14,
										color: 'black',
										width: 'auto',
										fontWeight: 'bold',
										marginTop: 10,
										backgroundColor: 'rgb(255,186,0)',
										left: 10,
										position: 'absolute',
										padding: 2,
										shadowColor: '#000',
										shadowOffset: {
											width: 0,
											height: 5
										},
										shadowOpacity: 0.34,
										shadowRadius: 6.27,

										elevation: 15
									}}
								>
									{'Aanbevolen'}
								</Text>
							) : null}
						</ImageBackground>
					</TouchableOpacity>
					<View
						style={{ height: 1, width: '100%', backgroundColor: 'white' }}
					/>
				</React.Fragment>
			);
		} else {
			//event or activity
			let eventUri =
				'http://adminpanel.representin.nl/image.php?image=/events/Fotos/';
			let activityUri =
				'http://adminpanel.representin.nl/image.php?image=/activiteiten/Fotos/';
			let partyUri =
				'http://adminpanel.representin.nl/image.php?image=/uitgaan/Fotos/';
			return (
				<React.Fragment>
					<TouchableOpacity
						id={item.Id}
						onPress={() => _openDetails(item.Id, item.Titel, item.Type)}
						activeOpacity={0.9}
						style={{
							flex: 1,
							flexDirection: 'row',
							marginBottom: 1,
							backgroundColor: 'black',
							underlayColor: 'black'
						}}
					>
						<ImageBackground
							style={{
								width: '100%',
								height: 180,
								alignItems: 'flex-end'
							}}
							imageStyle={{
								resizeMode: 'stretch'
							}}
							source={
								item.Soort !== '0'
									? item.Type == 'events' || item.Soort == '1'
										? {
											uri: eventUri + item.Foto + imageParams
										}
										: {
											uri: activityUri + item.Foto + imageParams
										}
									: {
										uri: partyUri + item.Foto + imageParams
									}
							}
						>
							{item.Uitlichten > 0 && item.Geannuleerd !== 0 ? (
								<Text
									style={{
										fontSize: 14,
										color: 'black',
										width: 'auto',
										fontWeight: 'bold',
										marginTop: 10,
										backgroundColor: 'rgb(255,186,0)',
										left: 10,
										position: 'absolute',
										padding: 2,
										shadowColor: '#000',
										shadowOffset: {
											width: 0,
											height: 5
										},
										shadowOpacity: 0.34,
										shadowRadius: 6.27,

										elevation: 15
									}}
								>
									{'Aanbevolen'}
								</Text>
							) : null}
							{item.Geannuleerd == 1 ? (
								<Text
									style={{
										fontSize: 16,
										color: 'white',
										width: 'auto',
										fontWeight: 'bold',
										marginTop: 10,
										backgroundColor: 'red',
										left: 10,
										position: 'absolute',
										padding: 2,
										shadowColor: '#000',
										shadowOffset: {
											width: 0,
											height: 5
										},
										shadowOpacity: 0.34,
										shadowRadius: 6.27,

										elevation: 15
									}}
								>
									{'Geannuleerd'}
								</Text>
							) : null}
							<View
								style={{
									position: 'absolute',
									bottom: 0,
									justifyContent: 'center',
									alignItems: 'center',
									width: '100%'
								}}
							>
								<LinearGradient
									colors={['rgba(0,0,0,0.9)', 'transparent']}
									start={{ x: 0, y: 1 }}
									end={{ x: 0, y: 0 }}
									style={{
										height: 80,
										width: '100%',
										paddingLeft: 10,
										paddingRight: 10,
										paddingBottom:
											item.Locatie !== '' ||
												item.Plaatsnaam !== ''
												? Dimensions.get('window').width <
													340
													? 0
													: 30
												: 30
									}}
								>
									{item.Geenadres !== '1' ? (
										<Text
											style={{
												fontSize: 12,
												color: 'white',
												width: 'auto',
												fontWeight: 'bold',
												marginTop: 12,
												backgroundColor: 'black',
												left: 10,
												position: 'absolute',
												paddingRight: 2,
												paddingLeft: 2,
												shadowColor: '#000',
												shadowOffset: {
													width: 0,
													height: 5
												},
												shadowOpacity: 0.34,
												shadowRadius: 6.27,

												elevation: 15
											}}
										>
											{item.distance === 0 ? " - KM" : item.distance + ' KM'}
										</Text>
									) : null}
									<Text
										style={{
											fontSize:
												item.Titel.length > 33 ? 18 : 20,
											marginTop: 28,
											height: 25,
											color: 'white',
											fontWeight: 'bold',
											textShadowColor: 'rgba(0, 0, 0, 0.4)',
											textShadowOffset: {
												width: -1,
												height: 1
											},
											textShadowRadius: 10,
											elevation: 22
										}}
									>
										{item.Titel}
									</Text>

									<Text
										style={{
											fontSize: 14,
											color: 'white',
											textShadowColor: 'rgba(0, 0, 0, 0.4)',
											textShadowOffset: {
												width: -1,
												height: 1
											},
											textShadowRadius: 10,
											elevation: 22
										}}
									>
										{item.Type == 'events'
											? item.Geenadres !== '1'
												? item.Locatie !== '' ||
													item.Plaatsnaam !== ''
													? item.Regio == '' &&
														item.Locatie == '' &&
														item.Plaatsnaam == ''
														? item.Datum_Begin +
														' om ' +
														item.BeginTime
														: item.Regio !== ''
															? item.Datum_Begin +
															' om ' +
															item.BeginTime +
															' | ' +
															item.Locatie +
															item.Plaatsnaam +
															', ' +
															item.Regio
															: item.Datum_Begin +
															' om ' +
															item.BeginTime +
															' | ' +
															item.Locatie +
															item.Plaatsnaam
													: ''
												: item.Datum_Begin +
												' om ' +
												item.BeginTime
											: item.omschrijvingsVeld !== '' &&
												(item.Locatie !== '' ||
													item.Plaatsnaam !== '')
												? item.omschrijvingsVeld +
												' | ' +
												item.Locatie +
												item.Plaatsnaam
												: item.omschrijvingsVeld == ''
													? item.Locatie + item.Plaatsnaam
													: item.omschrijvingsVeld}
									</Text>
								</LinearGradient>
							</View>
							<View style={{ flexDirection: 'row', paddingTop: 5 }}>
								<TouchableOpacity
									style={{
										paddingRight: 3,
										paddingTop: 5,
										paddingBottom: 3,
										paddingLeft: 3,
										width: 30
									}}
									onPress={() => toggleFav(item)}
								>
									<Icon
										name={
											isFavorite(item)
												? 'favorite'
												: 'favorite-border'
										}
										size={25}
										color="white"
										underlayColor={'rgba(255, 255, 255, 0)'}
										iconStyle={{
											textShadowColor: 'rgba(0, 0, 0, 0.4)',
											textShadowOffset: {
												width: 0,
												height: 1
											},
											textShadowRadius: 0.5
										}}
										style={{
											marginRight: 15,
											width: '100%'
										}}
									/>
								</TouchableOpacity>
								<TouchableOpacity
									style={{
										paddingRight: 3,
										paddingTop: 5,
										paddingBottom: 3,
										width: 30
									}}
									onPress={() => _OnShare(item)}
								>
									<Icon2
										name={'share'}
										size={27}
										color="white"
										underlayColor={'rgba(255, 255, 255, 0)'}
										style={{
											marginTop: -3,
											textShadowColor: 'rgba(0, 0, 0, 0.4)',
											textShadowRadius: 0.5,
											textShadowOffset: {
												width: 0,
												height: 1
											}
										}}
									/>
								</TouchableOpacity>
							</View>
						</ImageBackground>
					</TouchableOpacity>
				</React.Fragment>
			);
		}
	}

	function _calculateDistanceTwoPoints(uLat, uLng, fLat, fLng) {
		//uLat = user latitude
		//fLat = popular latitude

		var R = 6371; // km
		//has a problem with the .toRad() method below.
		var x1 = fLat - uLat;
		var dLat = _toRad(x1);
		var x2 = fLng - uLng;
		var dLon = _toRad(x2);
		var a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos(_toRad(uLat)) *
			Math.cos(_toRad(fLat)) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);
		var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		var d = R * c;
		return Math.round(d * 10) / 10;
	}

	function _toRad(Value) {
		/** Converts numeric degrees to radians */
		return (Value * Math.PI) / 180;
	}

	async function toggleFav(item) {
		if (!isOffline && !hasFailed) {
			_updateFavoriteDB(item);
		} else {
			Alert.alert(
				'Offline',
				'Je bent momenteel offline, controleer je internet en probeer het opnieuw'
			);
		}
	}

	async function _updateFavoriteDB(item) {
		const id = keyExtractor(item);
		let response = await ApiFavorites._updateFavorite(id);
		await AsyncStorage.setItem('Favorites', JSON.stringify(response), () => {
			if (response === '1') {
				_getFavoriteListDB();
				if (params.screen === 'AllFavorites') {
					_getScreenData();
				}
			}
		})
	}

	function isFavorite(item) {
		const id = keyExtractor(item);
		return favorite.includes(parseInt(id));
	}

	if (Loading) {
		return (
			<View style={[styles.horizontal, styles.container]}>
				<ActivityIndicator size="large" color="white" />
			</View>
		)
	} else {
		if (dataSource == 'leeg' || dataSource.length == 0) {
			if (params.screen == 'AllFavorites') {
				return (
					<ErrorMessage
						customMessage={
							'Geen favoriete items'
						}
						customClosingMessage={
							'Tip: zet een event of uitje als favoriet\nen ze verschijnen hier'
						}
						retryMessage={false}
						retryButton={true}
						onPress={() => _onRefresh(params.screen)}
					/>
				)
			} else {
				return (
					<ErrorMessage
						customMessage={
							'Er zijn in deze categorie geen events'
						}
						customClosingMessage={
							'Tip: swipe naar links of rechts\nvoor events in andere categorieen'
						}
						retryMessage={false}
						retryButton={true}
						onPress={() => _onRefresh()}
					/>
				)
			}
		} else {
			if (dataSource == 'leegFilter') {
				return (
					< View
						style={{
							alignItems: 'center',
							height: '100%',
							backgroundColor: 'black',
							justifyContent: 'center'
						}
						}
					>
						<Text
							style={{
								color: 'white',
								fontSize: 20,
								textAlign: 'center',
								fontWeight: 'bold',
								marginTop: 20
							}}
						>
							{'Helaas!'}
						</Text>
						<Text
							style={{
								color: 'white',
								textAlign: 'center',
								fontSize: 16
							}}
						>
							{
								'Er zijn geen ' + params.tabInfo?.Name.toLowerCase() + ' events gevonden\nin jouw gefilterd gebied'
							}
						</Text>
						<TouchableOpacity
							onPress={() => _resetFilter()}
							style={{ marginTop: 30 }}
						>
							<LocationOffIcon
								name="location-off"
								size={70}
								color={'rgb(255,187,0)'}
							/>
						</TouchableOpacity>
						<Text style={{ color: 'white' }}>
							{'Klik op de knop om de filter te resetten'}
						</Text>
					</View >
				)
			} else if (dataSource == 'noAreaItems') {
				return (
					<ErrorMessage
						retryMessage={false}
						customMessage={
							'Er zijn geen ' + params.tabInfo?.Name.toLowerCase() + ' events gevonden\nin jouw gebied'
						}
					/>)
			} else if (dataSource.length === 0 ||
				dataSource[0].length === 0) {
				return (
					<ErrorMessage retryMessage={true} onPress={() => _onRefresh()} />
				)
			} else {
				if (isOffline) {
					return (
						<ErrorMessage
							retryMessage={true}
							customMessage={
								'Er ging iets mis met de verbinding,\nwaardoor de inhoud niet geladen kan worden'
							}
							customClosingMessage={
								'Tip: controleer of je internet of WIFI verbinding hebt\nsluit de app af en start hem opnieuw op.\nLukt het niet? Neem contact met ons op'
							}
							onPress={() => _onRefresh()}
						/>
					)
				} else {
					if (isCachedData) {
						return (
							<TouchableOpacity
								onPress={async () => {
									Alert.alert(
										'Oops',
										'Er ging iets mis met de verbinding, controleer jouw internet en probeer het opnieuw'
									);
									_onRefresh();
								}}
							>
								<View
									style={{
										height: 35,
										width: '100%',
										backgroundColor: '#AD0006',
										justifyContent: 'center',
										flexDirection: 'row',
										alignItems: 'center'
									}}
								>
									<RetryIcon
										name="refresh"
										onPress={() => _onRefresh()}
										size={27}
										color={'white'}
									/>
									<Text style={{ color: 'white' }}>
										{'Nieuwste events'}
									</Text>
								</View>
							</TouchableOpacity>
						)
					} else {
						return (
							<View style={styles.container}>
								<FlatList
									data={dataSource}
									ref={flatListRef}
									getItemLayout={(data, index) => (
										{ length: 180, offset: 180 * index, index }
									)}
									renderItem={
										(item) => renderItem(item)
									}
									ItemSeparatorComponent={renderSeperator}
									keyExtractor={(item) => item.Id.toString()}
									initialNumToRender={3}
									maxToRenderPerBatch={3}
									updateCellsBatchinPeriod={150}
									extraData={favorite}
									windowSize={10}
									removeClippedSubviews={Platform.OS == 'ios' ? false : true}

									keyboardShouldPersistTaps="always"
									refreshControl={
										<RefreshControl
											refreshing={refreshing}
											onRefresh={() => {
												_onRefresh();
												_getFavoriteListDB();
												_getScreenData();
											}}
											tintColor="white"
											title="Sleep omlaag"
											titleColor="white"
										/>
									}
								/>
							</View>
						)
					}
				}
			}
		}
	}
}
const styles = StyleSheet.create({
	container: {
		backgroundColor: 'black',
		justifyContent: 'center',
		flex: 1
	},
	horizontal: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		padding: 10
	},
	header: {
		alignItems: 'center',
		backgroundColor: 'black',
		width: '100%',
		height: 50,
		flexDirection: 'row',
		justifyContent: 'center'
	},
	headerLogo: {
		resizeMode: 'center'
	}
});
