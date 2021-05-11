/* eslint-disable react/prop-types */
import React, { useCallback, useState } from 'react';
import { Dimensions } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useFocusEffect } from '@react-navigation/native';
import EventScreenTemplate from '../components/EventScreenTemplate';
import GetApiData from '../api/GetApiListData';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
const TopTab = createMaterialTopTabNavigator();

const tabBarOptions = {
	activeTintColor: 'black',
	headerBackTitleVisible: false,
	inactiveTintColor: '#888888',
	showIcon: false,
	labelStyle: {
		fontSize: 14
	},
	scrollEnabled: true,
	swipeEnabled: false,
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
		borderBottomWidth: 1,
		borderBottomColor: 'black'
	},
	indicatorStyle: {
		height: 3,
		backgroundColor: 'black',
	}
}

export default function TopTabNavigator({ route }) {
	let initFilterValue = route.params.initFilterValue
	const [tabs, setTabs] = useState([]);

	useFocusEffect(
		useCallback(() => {
			async function _getTabs() {
				let Tabs = await GetApiData._getTabs('Events');
				let tabList = [
					<TopTab.Screen name="Populair" key={0} initialParams={{
						initFilterValue, screen: 'PopularEvents', tabInfo: {
							"Name": "Populaire"
						}, themeScreen: 0
					}} component={EventScreenTemplate} />,
				];
				let index = 3;
				if (Tabs !== 0) {
					Tabs.forEach((tab) => {
						tabList.push(
							<TopTab.Screen
								key={index}
								name={tab.Name}
								initialParams={{ initFilterValue, screen: tab.Name, tabInfo: tab, themeScreen: 1 }}
								component={EventScreenTemplate}
							/>
						);
						index++;
					})
				}
				if (tabList.length > 0) {
					setTabs(tabList);
				}
			}

			_getTabs();
		}, [initFilterValue])
	)

	return (
		tabs.length > 0 ? (
			<TopTab.Navigator tabBarOptions={tabBarOptions} backBehavior='none' initialLayout={{ width: Dimensions.get('window').width }}>
				{tabs}
			</TopTab.Navigator>
		) : (
			<View style={[styles.horizontal, styles.container]}>
				<ActivityIndicator size="large" color="white" />
			</View>
		)
	)
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
