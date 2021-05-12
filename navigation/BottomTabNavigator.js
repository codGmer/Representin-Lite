/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
import React, { useEffect, useState } from 'react';

import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import TabBarIcon from '../components/TabBarIcon';
import * as Linking from 'expo-linking';

import EventsStack from './EventsStack';
import MoreStack from './MoreStack';
import GetApiData from '../api/GetApiListData';

const BottomTab = createMaterialBottomTabNavigator();

export default function BottomTabNavigator({ route, navigation }) {
	const [initFilterValue] = useState(route.params.initFilterValue);

	useEffect(() => {

		_addInitialUrl();

		Linking.addEventListener('url', _handleRedirect);

		return () => {
			Linking.removeEventListener('url', _handleRedirect);
		};

	}, [])

	async function _addInitialUrl() {
		try {
			Linking.getInitialURL()
				.then(async url => {
					if (url) {
						let initialUrl = Linking.parse(url);
						let id = initialUrl.queryParams.Id;
						if (id) {
							let removeAppFromUrl = initialUrl.path.replace('app/', '');
							let response = await GetApiData._checkIdType(
								id
							);
							if (response == '0') {
								navigation.navigate('Events', {
									screen: 'Details',
									params: {
										Id: id,
										Titel: removeAppFromUrl
									},
									initial: false
								});
							} else if (response == '1') {
								navigation.navigate('Activities', {
									screen: 'ActivityDetails',
									params: {
										Id: id,
										Titel: removeAppFromUrl
									},
									initial: false
								});
							} else {
								// eslint-disable-next-line no-undef
								alert('Deze link werkt helaas niet.');
							}
						}
					}
				})
				.catch(err => {
					console.log(err);
					// eslint-disable-next-line no-undef
					alert(
						'Er ging iets mis met deze link, controleer je link!'
					);
				});
		} catch (error) {
			console.log(error);
			// eslint-disable-next-line no-undef
			alert('Er ging iets mis met deze link, controleer je link!');
		}
	}

	async function _handleRedirect(event) {
		try {
			let test = Linking.parse(event.url);
			if (test.path !== null) {
				let removeAppFromUrl = test.path.replace('app/', '');
				let Id = test.queryParams.Id;
				if (typeof Id !== 'undefined') {
					let response = await GetApiData._checkIdType(Id);
					if (response == '0') {
						navigation.navigate('Events', {
							screen: 'Details',
							params: {
								Id,
								Titel: removeAppFromUrl
							},
							initial: false
						});
					} else if (response == '1') {
						navigation.navigate('Activities', {
							screen: 'ActivityDetails',
							params: {
								Id,
								Titel: removeAppFromUrl
							},
							initial: false
						});
					} else {
						// eslint-disable-next-line no-undef
						alert('Deze link werkt helaas niet.');
					}
				}
			}
		} catch (error) {
			console.log(error);
		}
	}

	//#region Options
	let EventOptions = {
		tabBarLabel: 'Events',
		tabBarColor: 'black',
		tabBarIcon: ({ focused }) => (
			<TabBarIcon focused={focused} name={'md-calendar'} />
		)
	};
	let MoreOptions = {
		header: null,
		tabBarLabel: 'Meer',
		tabBarColor: '#000000',
		tabBarIcon: ({ focused }) => (
			<TabBarIcon focused={focused} name={'md-menu'} />
		)
	};

	//#endregion Options
	return (
		<BottomTab.Navigator backBehavior='none' screenOptions={{ headerTintColor: 'white', headerBackTitleVisible: false }}>
			<BottomTab.Screen
				name="EventsStack"
				options={EventOptions}
				component={EventsStack}
				initialParams={{ initFilterValue }}
			/>
			<BottomTab.Screen
				name="Meer"
				options={MoreOptions}
				component={MoreStack}
				initialParams={{ initFilterValue }}
			/>
		</BottomTab.Navigator>
	);
}
