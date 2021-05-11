/* eslint-disable react/prop-types */
import React, { useState, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import GetApiData from '../api/GetApiListData';
import { useFocusEffect } from '@react-navigation/native';
import WinScreenTemplate from '../components/WinScreenTemplate';

const Tab = createMaterialTopTabNavigator();

const tabBarOptions = {
	activeTintColor: 'black',
	inactiveTintColor: '#888888',
	showIcon: false,
	labelStyle: {
		fontSize: 14,
	},
	headerBackTitleVisible: false,
	scrollEnabled: true,
	swipeEnabled: false,
	animationEnabled: false,
	style: {
		borderBottomWidth: 1,
		borderBottomColor: 'black'
	},
	tabStyle: {
		shadowColor: '#fff',
		shadowOffset: {
			width: 0,
			height: 0
		},
		shadowOpacity: 0,
		shadowRadius: 0,
		elevation: 0,
		width: 'auto',
	},
	indicatorStyle: {
		height: 2,
		backgroundColor: 'black',
	}
}

export default function TopTabNavigatorWin({ route }) {
	const [gotTabs, setGotTabs] = useState('');
	const [tabs, setTabs] = useState([]);

	let params = route.params

	useFocusEffect(
		useCallback(() => {
			async function _getTabs() {
				let Tabs = await GetApiData._getTabs('Win');
				if (Tabs.length > 0) {
					let tabList = [];
					Tabs.forEach(tab => {
						switch (tab.Name) {
							case 'Events':
								tabList.push(
									<Tab.Screen
										name={tab.Name}
										key={0}
										initialParams={{ params, screen: 'WinEvents' }}
										component={WinScreenTemplate}
									/>
								);
								break;
							case 'Uitjes':
								tabList.push(
									<Tab.Screen
										name={tab.Name}
										key={1}
										initialParams={{ params, screen: 'WinActivitys' }}
										component={WinScreenTemplate}
									/>
								);
								break;
							case 'Partys':
								tabList.push(
									<Tab.Screen
										name={tab.Name}
										key={2}
										initialParams={{ params, screen: 'WinPartys' }}
										component={WinScreenTemplate}
									/>
								);
								break;
							default:
								break;
						}
					});
					setTabs(tabList);
					setGotTabs(true);
				}
			}
			_getTabs();
		}, [gotTabs])
	);

	return gotTabs ? (
		<Tab.Navigator backBehavior='none' tabBarOptions={tabBarOptions}>{tabs}</Tab.Navigator>
	) : (
			<View style={[styles.horizontal, styles.container]}>
				<ActivityIndicator size="large" color="white" />
			</View>
		);
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
	}
});
