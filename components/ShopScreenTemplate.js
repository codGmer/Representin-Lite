import React, { useState, useEffect, useRef } from 'react';
import {
	StyleSheet,
	View,
	Text,
	TouchableOpacity,
	ActivityIndicator,
	ImageBackground,
	FlatList,
	RefreshControl,
	BackHandler,
	Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Col, Row, Grid } from 'react-native-easy-grid';
import ErrorMessage from '../components/ErrorMessage';
import GetApiListData from '../api/GetApiListData';

export default function ShopScreenTemplate({ navigation, route }) {
	const [connectionError, setConnectionError] = useState(null);
	const [dataSource, setDataSource] = useState([]);
	const [Loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const isFirstRun = useRef(true);

	useEffect(() => {
		async function init() {
			if (!refreshing && isFirstRun.current) {
				setLoading(true);
				_getShopItems();
				isFirstRun.current = false;
				return;
			} else if (refreshing && !isFirstRun.current) {
				_getShopItems();
			}
		}

		async function _getShopItems() {
			let response = await GetApiListData._fetchRequest(
				{
					action: 'getShopItems',
					CategoryID: route.params.params.CategoryID,
					TabName: typeof route.params.screen !== 'undefined' ? route.params.screen : '',
					ThemeScreen: route?.params?.themeScreen,
					ListID: route.params.tabInfo.TabID
				},
				true,
				203040
			);
			if (response != 0) {
				setDataSource(response);
				setConnectionError(false);
				setRefreshing(false);
			} else {
				setConnectionError(true);
				setRefreshing(false);
			}
		}
		init();

		return function cleanup() {
			BackHandler.removeEventListener(
				'hardwareBackPress',
				handleBackPress
			);
			BackHandler.addEventListener('hardwareBackPress', handleBackPress);
		}
	}, [refreshing == true])

	useEffect(() => {
		if (Object.values(dataSource).length > 0) {
			setLoading(false)
		}
	}, [dataSource])

	function handleBackPress() {
		navigation.goBack();
		return true;
	};

	function _search() {
		navigation.navigate('Search', {
			shopSearch: true,
			data: dataSource
		});
	};

	function _openDetails(Id, Type) {
		if (Type == 'events') {
			navigation.navigate('Details', { Id, Shop: true });
		} else if (Type == 'activities') {
			navigation.navigate('ActivityDetails', {
				Id,
				Shop: true
			});
		} else {
			navigation.navigate('ProductDetails', {
				Id,
				Shop: true
			});
		}
	};

	function renderItem({ item }) {
		let eventUri =
			'http://adminpanel.representin.nl/image.php?image=/events/Fotos/';
		let activityUri =
			'http://adminpanel.representin.nl/image.php?image=/activiteiten/Fotos/';
		let partyUri =
			'http://adminpanel.representin.nl/image.php?image=/uitgaan/Fotos/';
		let productUri =
			'http://adminpanel.representin.nl/image.php?image=/sales/ProductFotos/';
		return (
			<TouchableOpacity
				id={item.Id}
				onPress={() => _openDetails(item.Id, item.Type)}
				style={{
					flex: 1,
					flexDirection: 'row',
					marginBottom: 1,
					backgroundColor: 'black'
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
						item.Type == 'events'
							? item.Soort !== '0'
								? {
									uri: eventUri + item.Foto
								}
								: {
									uri: partyUri + item.Foto
								}
							: item.Type == 'products'
								? { uri: productUri + item.Foto }
								: { uri: activityUri + item.Foto }
					}
				>
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
								height: item.Titel.length > 35 && Platform.OS === 'android' && item.PriceLabel !== '' ? 105 : item.PriceLabel !== '' && Platform.OS === 'android' ? 80 : 77,
								width: '100%',
								paddingLeft: 10,
								paddingRight: 10,
								paddingBottom: 30
							}}
						>
							<Text
								style={{
									fontSize: 18,
									marginTop: 15,
									color: 'white',
									fontWeight: 'bold'
								}}
							>
								{item.Titel}
							</Text>
							<Text
								style={{
									fontSize: 11,
									color: 'white',
									marginBottom: -3
								}}
							>
								{item.PriceLabel}
							</Text>
							{item.OutOfStock > 0 || (item.OutOfStockProperties > 0 && item.InStockProperties == 0) ? (
								<View
									style={{
										flexDirection: 'row',
										marginTop: item.PriceLabel
											? Platform.OS === 'ios'
												? 5
												: 0
											: Platform.OS === 'ios'
												? -10
												: -15
									}}
								>
									<Text
										style={{
											color: 'red',
											fontSize: 18,
											textDecorationLine: 'line-through'
										}}
									>
										{'€ ' + item.MinPrice}
									</Text>
									<Text
										style={{
											color: 'red',
											fontSize: 18,
											fontWeight: 'bold',
											marginLeft: 5
										}}
									>
										{'Uitverkocht'}
									</Text>
								</View>
							) : item.Price == '' ||
								typeof item.MinPrice == 'undefined' ? null : (
								<View
									style={{
										height: 45,
										width: '100%',
										elevation: 5,
										marginTop: item.PriceLabel
											? Platform.OS === 'ios'
												? -8
												: -10
											: Platform.OS === 'ios'
												? -20
												: -25
									}}
								>
									<Grid>
										{item.OldPrice ? (
											<Col
												style={{
													width: 'auto'
												}}
											>
												<Text
													style={{
														color: 'grey',
														marginTop: 12,
														fontSize: 18,
														textDecorationLine:
															'line-through',
														width: 'auto'
													}}
												>
													{parseFloat(item.OldPrice) %
														1
														? '€ ' +
														parseFloat(
															item.OldPrice
														).toFixed(2)
														: '€ ' +
														parseFloat(
															item.OldPrice
														)}
												</Text>
											</Col>
										) : null}
										<Col
											style={{
												marginLeft: item.OldPrice
													? 5
													: 0
											}}
										>
											<Text
												style={{
													color: 'white',
													marginTop: 8,
													fontSize: 23,
													fontWeight: 'bold'
												}}
											>
												{parseFloat(item.MinPrice) % 1 || parseFloat(item.MaxPrice) % 1
													? parseFloat(item.MinPrice) == parseFloat(item.MaxPrice) ? '€ ' +
														parseFloat(
															item.MinPrice
														).toFixed(2) : '€ ' +
														parseFloat(
															item.MinPrice
														).toFixed(2) + ' - € ' + parseFloat(item.MaxPrice).toFixed(2)
													: parseFloat(item.MinPrice) == parseFloat(item.MaxPrice) ? '€ ' +
														parseFloat(
															item.MinPrice
														) : '€ ' +
														parseFloat(
															item.MinPrice
														) + ' - € ' + parseFloat(item.MaxPrice)}
											</Text>
										</Col>
									</Grid>
								</View>
							)}
						</LinearGradient>
					</View>
				</ImageBackground>
			</TouchableOpacity>
		);
	};

	function renderSeperator() {
		return (
			<View
				style={{ height: 1, width: '100%', backgroundColor: 'white' }}
			/>
		);
	};

	function _onRefresh() {
		setRefreshing(true)
	}

	if (Loading) {
		return (
			<View style={[styles.horizontal, styles.container]}>
				<ActivityIndicator size="large" color="white" />
			</View>
		);
	} else {
		if (dataSource == 'leeg') {
			return (
				<ErrorMessage
					customMessage={
						'Er zijn (nog) geen ' +
						route.params.params.Category_Name.toLowerCase() +
						' toegevoegd\naan de shop'
					}
					customClosingMessage={'Tip: kijk eens bij de andere categorieen\nvoor andere interessante producten'}
					retryMessage={false}
				/>
			);
		} else if (connectionError) {
			return (
				<ErrorMessage
					onPress={() => _onRefresh()}
					retryMessage={true}
				/>
			)
		} else {
			return (
				<Grid style={styles.container}>
					<Row>
						<FlatList
							data={dataSource}
							renderItem={renderItem}
							keyExtractor={(item, index) => item.Id.toString()}
							ItemSeparatorComponent={renderSeperator}
							initialNumToRender={15}
							windowSize={10}
							extraData={dataSource}
							refreshControl={
								<RefreshControl
									refreshing={refreshing}
									onRefresh={() =>
										setRefreshing(true)
									}
									tintColor="white"
									title="Sleep omlaag"
									titleColor="white"
								/>
							}
						/>
					</Row>
				</Grid>
			);
		}
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: 'black',
		justifyContent: 'center'
	},
	horizontal: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		padding: 10
	}
});
