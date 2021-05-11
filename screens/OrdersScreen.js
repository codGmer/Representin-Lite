/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import {
	StyleSheet,
	View,
	Text,
	ActivityIndicator,
	BackHandler,
	TouchableOpacity,
	FlatList
} from 'react-native';
import { Col, Row, Grid } from 'react-native-easy-grid';
import ErrorMessage from '../components/ErrorMessage';
import DeleteIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import GetApiListData from '../api/GetApiListData';

export default function OrdersScreen({ navigation }) {

	const [dataSource, setDataSource] = useState([]);
	const [Loading, setLoading] = useState(true);
	const [customer_ID, setCustomer_ID] = useState('');
	const [deleteInProgress, setDeleteInProgress] = useState(false);

	useEffect(() => {
		const unsubscribe = navigation.addListener('focus', () => {
			_getAllOrdersFromUser();
		});

		BackHandler.addEventListener('hardwareBackPress', _handleBackPress);

		return function cleanup() {
			BackHandler.removeEventListener('hardwareBackPress', _handleBackPress);
			unsubscribe();
		}
	}, []);

	function _handleBackPress() {
		navigation.goBack();
		return true;
	}

	async function _getAllOrdersFromUser() {
		let userdata = await SecureStore.getItemAsync('userData');
		let userID = JSON.parse(userdata);
		setCustomer_ID(userID.UserID);
		let response = await GetApiListData._fetchRequest({
			action: 'getAllOrdersFromUser',
			customerID: userID.UserID
		});
		if (response != null) {
			setDataSource(response);
			setLoading(false);
		}
	}

	async function _hideOrder(orderID) {
		setDeleteInProgress(true);
		let response = await GetApiListData._fetchRequest({
			action: 'hideOrderFromUser',
			orderID: orderID
		});
		if (response === '1') {
			_getAllOrdersFromUser();
			setDeleteInProgress(false);
		} else {
			alert(
				'Het verwijderen is niet gelukt, probeer het later opnieuw of neem contact met ons op.'
			);
			setDeleteInProgress(false);
		}
	}

	function renderItem({ item, index }) {
		return (
			<TouchableOpacity
				key={item.OrderID}
				onPress={() => {
					navigation.navigate('OrderDetails', {
						item
					});
				}}
			>
				<Row
					style={{
						height: 70,
						backgroundColor: '#f7f7f7',
						borderWidth: 1,
						borderColor: '#e3e3e3'
					}}
				>
					<Grid>
						<Row size={50} style={{ flexDirection: 'column' }}>
							<Text
								style={{
									marginTop: 5,
									fontSize: 16,
									width: '100%',
									marginLeft: 10,
									fontWeight: 'bold'
								}}
							>
								{'Bestelling #' + item.OrderID}
							</Text>
							<Text
								style={{
									fontSize: 12,
									marginLeft: 10,
									width: 300,
									marginTop: 10
								}}
							>
								{'Aangemaakt: ' + item.Created}
							</Text>
							<Text
								style={{
									fontSize: 12,
									marginLeft: 10,
									width: '100%'
								}}
							>
								{'Update: ' + item.Modified}
							</Text>
						</Row>
					</Grid>
					<Col
						style={{
							marginLeft: 10
						}}
					>
						<Row
							style={{
								marginLeft: 20,
								alignSelf: 'flex-end',
								marginRight: 20
							}}
						>
							<Text
								style={{
									fontSize: 16,
									marginRight: 10,
									marginTop: 5,
									color: 'black'
								}}
							>
								{item.Total !== ''
									? '€ ' + item.Total
									: '€ 0.00'}
							</Text>
						</Row>
						<Row style={{ marginLeft: 20, alignSelf: 'flex-end' }}>
							<Text
								style={{
									fontSize: 12,
									marginRight: 10,
									marginTop: 15
								}}
							>
								{item.Status}
							</Text>
						</Row>
						<DeleteIcon
							style={{
								position: 'absolute',
								top: 2,
								right: 0
							}}
							name="delete"
							size={25}
							onPress={() => {
								if (!deleteInProgress) {
									_hideOrder(item.OrderID);
								}
							}}
						/>
					</Col>
				</Row>
			</TouchableOpacity>
		);
	}

	if (Loading) {
		return (
			<View
				style={{
					alignItems: 'center',
					flex: 1,
					justifyContent: 'center'
				}}
			>
				<ActivityIndicator size="large" color="black" />
			</View>
		);
	} else {
		if (dataSource == 'leeg') {
			return (
				<ErrorMessage
					customMessage={'(Nog) geen bestellingen gevonden'}
					retryMessage={false}
				/>
			);
		} else {
			return (
				<View
					style={{
						height: 50,
						width: '100%',
						flex: 1
					}}
				>
					<Text
						style={{
							textAlign: 'center',
							marginTop: 10,
							marginBottom: 10
						}}
					>
						{'Mijn bestellingen'}
					</Text>
					<FlatList
						data={dataSource}
						renderItem={renderItem}
						keyExtractor={(item, index) => item.OrderID}
						ItemSeparatorComponent={renderSeperator}
						initialNumToRender={50}
						getItemLayout={(data, index) => (
							{ length: 70, offset: 70 * index, index }
						)}
					/>
				</View>
			);
		}
	}

	function renderSeperator() {
		return (
			<View
				style={{ height: 15, width: '100%', backgroundColor: 'white' }}
			/>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		//flex: 1,
		backgroundColor: '#fff',
		justifyContent: 'center'
	},
	horizontal: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		padding: 10
	},
	headerLogo: {
		resizeMode: 'center',
		alignSelf: 'center',
		width: 100,
		height: 80,
		marginLeft: 10
	}
});
