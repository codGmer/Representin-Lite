/* eslint-disable react/display-name */
/* eslint-disable react/prop-types */
import React, { useState, useCallback } from 'react';
import { View, Image, TouchableOpacity, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import TopTabNavigator from './TopTabNavigator';
import { createStackNavigator } from '@react-navigation/stack';
import SearchIcon from 'react-native-vector-icons/MaterialIcons';
import { Icon } from 'react-native-elements';
import DetailsScreen from '../screens/DetailsScreen';
import SearchScreen from '../screens/SearchScreen';
import GpsDistanceScreen from '../screens/GpsDistanceScreen';
import useLocalStorage from '../hook/UseLocalStorage';
import MainHeader from '../constants/MainHeader';

function MainTabNavigatorLeftHeader(navigation) {
    return (
        <View style={{ flexDirection: 'row', marginBottom: 5 }}>
            <View>
                <Image
                    source={require('../assets/images/App_Icon.png')}
                    style={{
                        marginLeft: 10,
                        height: 40,
                        width: 50
                    }}
                />
            </View>
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 8
                }}
            >
                <TouchableOpacity
                    onPress={() => navigation.navigate('Search', false)}
                >
                    <SearchIcon
                        name="search"
                        style={{
                            color: 'white',
                            marginLeft: 20
                        }}
                        size={23}
                    />
                </TouchableOpacity>
            </View>
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 5
            }}>
                <TouchableOpacity
                    onPress={() => navigation.navigate('Search', false)}
                    style={{ justifyContent: 'center' }}
                >
                    <Text
                        style={{
                            color: 'white',
                            fontSize: 19,
                            marginLeft: 20
                        }}
                    >
                        Zoeken...
						</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

function MainTabNavigatorHeaderRight(navigation, filterValue) {
    return (
        <View>
            <TouchableOpacity
                onPress={() =>
                    navigation.navigate('GpsDistance')
                }
                style={{ zIndex: 1 }}
            >
                <Icon
                    name="location-pin"
                    style={{ marginLeft: 5, marginRight: 10 }}
                    size={32}
                    type={'entypo'}
                    color={filterValue > 0 && filterValue < 100 ? 'rgb(255,187,0)' : 'white'}
                />
            </TouchableOpacity>
        </View>
    );
}

let MainHeaderStyle = {
    backgroundColor: 'black',
};

export default function EventsStack({ route }) {
    const Stack = createStackNavigator();
    let getLocalFilterValue = useLocalStorage('filterValue');
    const [localFilterValue, setLocalFilterValue] = useState(route.params.initFilterValue)

    useFocusEffect(
        useCallback(() => {
            async function getFilterValue() {
                setLocalFilterValue(await getLocalFilterValue);
            }
            getFilterValue();
        }, [])
    )
    async function getFilterValue() {
        setLocalFilterValue(await getLocalFilterValue);
    }

    getFilterValue();

    return (
        <Stack.Navigator screenOptions={{ headerShown: true, headerBackTitleVisible: false, headerTintColor: 'white' }}>
            <Stack.Screen
                options={({ navigation }) => ({
                    headerTitle: () => null,
                    headerLeft: () => MainTabNavigatorLeftHeader(navigation),
                    headerRight: () => MainTabNavigatorHeaderRight(navigation, localFilterValue),
                    headerStyle: MainHeaderStyle,
                })}
                initialParams={{ initFilterValue: route.params.initFilterValue }}
                name="Events"
                component={TopTabNavigator}
            />
            <Stack.Screen name="Details" component={DetailsScreen} options={MainHeader} />
            <Stack.Screen
                options={{ header: () => null }}
                name="Search"
                component={SearchScreen}
            />
            <Stack.Screen
                options={MainHeader({ backButton: true })}
                name="GpsDistance"
                component={GpsDistanceScreen}
            />
        </Stack.Navigator>
    );
}