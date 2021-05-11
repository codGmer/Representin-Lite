/* eslint-disable react/prop-types */
import React, { useState, useCallback, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import GetApiData from '../api/GetApiListData';
import { useFocusEffect } from '@react-navigation/native';
import ShopScreenTemplate from '../components/ShopScreenTemplate';

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

export default function TopTabNavigatorShop({ route, navigation }) {
	const [tabs, setTabs] = useState([]);
	const [loading, setLoading] = useState(true);

	let params = route.params
	useFocusEffect(
		useCallback(() => {
			async function _getTabs() {
				let Tabs = await GetApiData._getTabs('Shop');
				let tabList = [
					<Tab.Screen
						name={'Events'}
						key={0}
						initialParams={{
							params,
							screen: 'ShopTicketEvents',
							tabInfo: {
								TabID: 0
							},
							themeScreen: 0
						}}
						component={ShopScreenTemplate}
					/>,
					<Tab.Screen
						name={'Uitjes'}
						key={0}
						initialParams={{
							params,
							screen: 'ShopTicketActivities',
							tabInfo: {
								TabID: 0
							},
							themeScreen: 0
						}}
						component={ShopScreenTemplate}
					/>
				];
				let index = 2;
				if (Tabs !== 0) {
					Tabs.forEach((tab) => {
						tabList.push(
							<Tab.Screen
								key={index}
								name={tab.Name}
								initialParams={{ params, tabInfo: tab, themeScreen: 1 }}
								component={ShopScreenTemplate}
							/>
						);
						index++;
					})
				}
				setTabs(tabList);
			}
			_getTabs();
		}, [])
	);

	useEffect(() => {
		if (tabs.length > 0) {
			setLoading(false)
		}
	}, [tabs])

	return !loading ? (
		<Tab.Navigator backBehavior='none' sceneContainerStyle={{
			backgroundColor: 'black',
		}} tabBarOptions={tabBarOptions}>{tabs}</Tab.Navigator>
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
