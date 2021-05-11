import React, { useState, useEffect, useRef } from 'react';
import {
	StyleSheet,
	View,
	Text,
	TouchableOpacity,
	ActivityIndicator,
	ImageBackground,
	FlatList
} from 'react-native';
import NetInfo from "@react-native-community/netinfo";
import { LinearGradient } from 'expo-linear-gradient';
import { Row, Grid } from 'react-native-easy-grid';
import ErrorMessage from '../components/ErrorMessage';
import GetApiListData from '../api/GetApiListData';

export default function ShopScreen({ navigation }) {
	const [dataSource, setDataSource] = useState([]);
	const [Loading, setLoading] = useState(true);
	const [isOffline, setIsOffline] = useState(false);
	const isFirstRun = useRef(true);

	useEffect(() => {

		async function init() {
			if (isFirstRun.current) {
				_getConnectionInfo();
				isFirstRun.current = false;
				return;
			} else if (!isFirstRun.current) {
				navigation.addListener('focus', payload => {
					_getShopCategories();
				});
			}
		}

		async function _getConnectionInfo() {
			NetInfo.fetch().then(state => {
				if (!state.isConnected) {
					setIsOffline(true);
					setLoading(false);
				} else if (state.isConnected) {
					setIsOffline(false);
				}
			})
		}

		let unsubscribe = NetInfo.addEventListener(
			_handleConnectivityChange
		);

		function _handleConnectivityChange(status) {
			if (status.isConnected) {
				_getShopCategories();
				setIsOffline(false);
			} else {
				setLoading(false);
				setIsOffline(true);
			}
		}

		async function _getShopCategories() {
			let response = await GetApiListData._fetchRequest({
				action: 'getShopCategories'
			})
			setDataSource(response)
			setLoading(false)
			setIsOffline(false)
		}

		init()

		return function cleanup() {
			unsubscribe();
			navigation.removeListener('focus', payload => {
				_getShopCategories();
			});
		}
	}, [])

	async function _getShopCategories() {
		setLoading(true);
		let response = await GetApiListData._fetchRequest({
			action: 'getShopCategories'
		});
		setDataSource(response);
		setLoading(false);
	}

	function renderCategory({ item }) {
		return (
			<TouchableOpacity
				id={item.CategoryID}
				onPress={() => {
					if (item.CategoryID >= 2) {
						navigation.navigate('ShopItems', item)
					} else {
						navigation.navigate('ShopTabs', item)
					}
				}}
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
					source={{
						uri:
							'http://adminpanel.representin.nl/image.php?image=/shop/' +
							item.Foto
					}}
				>
					<View
						style={{
							position: 'absolute',
							bottom: 0,
							justifyContent: 'center',
							alignItems: 'center',
							width: '100%',
							marginTop: 20
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
								paddingBottom: 0
							}}
						>
							<Text
								style={{
									fontSize: 21,
									marginTop: 45,
									color: 'white',
									fontWeight:
										'bold'
								}}
							>
								{item.Category_Name}
							</Text>
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

	if (Loading) {
		return (
			<View style={[styles.horizontal, styles.container]}>
				<ActivityIndicator size="large" color="white" />
			</View>
		);
	} else {
		if (isOffline) {
			return (
				<ErrorMessage
					onPress={() => _getShopCategories()}
					retryMessage={false}
				/>
			);
		} else {
			return (
				<Grid style={styles.container}>
					<Row>
						<FlatList
							data={dataSource}
							renderItem={renderCategory}
							keyExtractor={(item) => item.CategoryID}
							ItemSeparatorComponent={renderSeperator}
							initialNumToRender={15}
							getItemLayout={(data, index) => (
								{ length: 180, offset: 180 * index, index }
							)}
							windowSize={10}
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