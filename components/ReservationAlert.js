import PropTypes from 'prop-types';
import React, { useEffect, useState, useRef } from 'react';
import { TouchableOpacity } from 'react-native';
import Modal from 'react-native-modal';
import CalendarPicker from 'react-native-calendar-picker';
import { Dimensions, View, Text, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { Icon } from 'react-native-elements';
import GetApiListData from '../api/GetApiListData';

function ReservationAlert(route) {
	const [enabledDates, setEnabledDates] = useState(null);
	const [selectedDate, setSelectedDate] = useState(null);
	const [selectedTime, setSelectedTime] = useState(null);

	const firstLoad = useRef(true);
	const doneCheckingAvailableRes = useRef(false);

	const { isVisible, onModalHide, item } = route;

	ReservationAlert.propTypes = {
		isVisible: PropTypes.bool.isRequired,
		item: PropTypes.object,
		onModalHide: PropTypes.func.isRequired
	};

	function getCurrentDate() {
		var d = new Date(),
			month = '' + (d.getMonth() + 1),
			day = '' + d.getDate(),
			year = d.getFullYear();
		if (month.length < 2) {
			month = '0' + month;
		}
		if (day.length < 2) {
			day = '0' + day;
		}
		return year + '-' + month + '-' + day
	}

	function onDateChange(date) {
		var d = new Date(date),
			month = '' + (d.getMonth() + 1),
			day = '' + d.getDate(),
			year = d.getFullYear();
		if (month.length < 2) {
			month = '0' + month;
		}
		if (day.length < 2) {
			day = '0' + day;
		}
		setSelectedDate(year + '-' + month + '-' + day);
	}

	useEffect(() => {
		async function getReservations() {
			doneCheckingAvailableRes.current = false;
			SecureStore.getItemAsync('userData').then(async data => {
				let parsedData = JSON.parse(data);
				let responseJson2 = await GetApiListData._fetchRequest({
					action: 'GetAvailableReservations',
					propertyID: item.PropertyID,
					orderID: item.OrderID
				})
				if (responseJson2 == 'leeg' && isVisible) {
					Alert.alert('Helaas', 'Er is helaas geen reserveringsdatum voor jouw aantal tickets beschikbaar, verminder jouw aantal');
					onModalHide();
					doneCheckingAvailableRes.current = false;
				} else if (responseJson2 !== 'leeg') {
					doneCheckingAvailableRes.current = true;
				}
				let responseJson = await GetApiListData._fetchRequest({
					action: 'getTempReservation',
					propertyID: item.PropertyID,
					orderID: item.OrderID,
					userID: parsedData.UserID
				})
				let date = new Date().getDate() < 10 ? '0' + new Date().getDate() : new Date().getDate();
				let month = (new Date().getMonth() + 1) < 10 ? '0' + (new Date().getMonth() + 1) : (new Date().getMonth() + 1)
				setSelectedDate(responseJson === 'leeg' ? new Date().getFullYear() + '-' + month + '-' + date : responseJson[0].Date)
				setSelectedTime({ Date: responseJson[0].Date, StartHour: responseJson[0].StartHour, EndHour: responseJson[0].EndHour, StartMinutes: responseJson[0].StartMinutes, EndMinutes: responseJson[0].EndMinutes })
				setEnabledDates(responseJson2 === 'leeg' ? [] : responseJson2);
				firstLoad.current = false;
			})
		}
		if (isVisible || firstLoad.current) {
			getReservations();
		}
	}, [isVisible])

	return (
		<Modal
			animationType="slide"
			backdropColor={'black'}
			backdropOpacity={0.7}
			isVisible={isVisible && doneCheckingAvailableRes.current}
			onBackdropPress={onModalHide}
			onDismiss={() => doneCheckingAvailableRes.current = false}
			onModalHide={() => doneCheckingAvailableRes.current = false}
		>
			<View
				style={{
					backgroundColor: 'black',
					alignSelf: 'center',
					borderRadius: 20,
					shadowRadius: 5,
					shadowOffset: {
						width: 0,
						height: 0,
					},
					height: 'auto',
					shadowColor: '#000000',
					shadowOpacity: 0.70,
					elevation: 5,
					width: Dimensions.get('screen').width - 40
				}}
			>
				<View style={{ borderRadius: 20, height: 'auto' }}>
					<LinearGradient
						colors={[
							'rgb(255,187,0)',
							'white'
						]}
						start={{ x: 0.5, y: 0.9 }}
						end={{ x: 0.5, y: 0.4 }}
						style={{
							height: 'auto',
							width: '100%',
							paddingLeft: 10,
							paddingRight: 10,
							borderRadius: 20
						}}
					>
						<View style={{ alignItems: 'center', marginBottom: 20 }}>
							<TouchableOpacity style={{ alignSelf: 'flex-end', height: 35, marginBottom: 8 }} onPress={onModalHide}>
								<Icon
									name="cross"
									type="entypo"
									color="black"
									containerStyle={{
										width: 30,
										alignSelf: 'flex-end',
										marginTop: 10
									}}
								/>
							</TouchableOpacity>
							<View
								style={{
									flexDirection: 'column',
									marginTop: -5
								}}
							>
								<CalendarPicker
									initialDate={selectedDate}
									selectedStartDate={selectedDate}
									onDateChange={onDateChange}
									startFromMonday={true}
									customHitSlop={{ top: 0, bottom: 20, left: 40, right: 40 }}
									selectedDayColor={'rgb(255, 187, 0)'}
									textStyle={{ fontSize: 14.5 }}
									enabledDatesTextStyle={{ fontSize: 14.5 }}
									customDatesStyles={() => { return { textStyle: { fontSize: 14.5 } } }}
									selectedDisabledDatesTextStyle={{ fontSize: 14.5 }}
									previousTitle={'< Vorige'}
									nextTitle={'Volgende >'}
									weekdays={['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Zat', 'Zon']}
									months={['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December']}
									disabledDates={'28-01-2021'}
									enabledDates={enabledDates?.map((element) => {
										var d1 = Date.parse(element.Date);
										var d2 = Date.parse(getCurrentDate());
										let currentdate = new Date(getCurrentDate());
										currentdate.setDate(currentdate.getDate() + 1)
										if (d1 > d2 && currentdate > d2) {
											return element.Date
										} else {
											return null;
										}
									})}
									width={320}
								/>
								<View style={{
									flexDirection: 'row', marginTop: 10, marginLeft: 10,
									width: Dimensions.get('screen').width - 40, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap'
								}}>
									{enabledDates?.map((element, index) => {
										if (selectedDate === element.Date) {
											return (
												<TouchableOpacity key={index} onPress={() => {
													SecureStore.getItemAsync('userData').then(async data => {
														let parsedData = JSON.parse(data);
														let response = await GetApiListData._fetchRequest({
															action: "AddTempReservation",
															userID: parsedData.UserID,
															orderID: item.OrderID,
															reservationID: element.ReservationID,
															activityID: item.ProductType == 'activities' ? item.ItemID : '',
															eventID: item.ProductType == 'events' ? item.ItemID : '',
															propertyID: item.PropertyID,
															date: element.Date
														})
														if (response[0].Result == '1') {
															onModalHide();
														} else if (response[0].Result == '0') {
															alert('fout !')
														} else if (response[0].Result == '-1') {
															alert('niet beschikbaar, kies een andere datum')
														}
													})
												}}
													style={{ width: 'auto', backgroundColor: selectedTime?.Date === element?.Date && selectedTime?.StartHour === element?.StartHour && selectedTime?.EndHour === element?.EndHour && selectedTime?.StartMinutes === element?.StartMinutes && selectedTime?.EndMinutes === element?.EndMinutes ? 'rgb(255, 187 ,0)' : 'white', borderWidth: 1, padding: 5, borderColor: 'black', height: 50, alignItems: 'center', justifyContent: 'center', marginRight: 10, marginTop: 10 }}>
													<Text>{element.StartHour + ':' + element.StartMinutes + ' - ' + element.EndHour + ':' + element.EndMinutes}</Text>
												</TouchableOpacity>
											)
										}
									})}
								</View>
							</View>
						</View>
					</LinearGradient>
				</View>
			</View>
		</Modal >
	);
}
export default ReservationAlert;
