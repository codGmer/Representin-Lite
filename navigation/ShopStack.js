/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
import React from 'react';
import ShoppingCartScreen from '../screens/ShoppingCartScreen';
import { TouchableOpacity, Text, View, Platform, Image } from 'react-native';
import { Icon } from 'react-native-elements';
import { createStackNavigator } from '@react-navigation/stack';
import { Row, Grid } from 'react-native-easy-grid';
import SearchIcon from 'react-native-vector-icons/MaterialIcons';
import ShopScreen from '../screens/ShopScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ShopTabs from './TopTabNavigatorShop';
import DetailsScreen from '../screens/DetailsScreen';
import SearchScreen from '../screens/SearchScreen';
import PaymentOverviewScreen from '../screens/PaymentOverViewScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import MainHeader from '../constants/MainHeader';
import { useNavigation } from '@react-navigation/native';

function ShopScreenHeaderRight(navigation) {
    return (
        <View style={{ flexDirection: 'row', marginRight: 15 }}>
            <Icon
                name={'shopping-cart'}
                size={25}
                color="white"
                underlayColor={'rgba(255, 255, 255, 0)'}
                onPress={() => {
                    navigation.navigate('ShoppingCart');
                }}
            />
        </View>
    );
}

function ShopScreenHeaderLeft({ navigation, backButton }) {
    return (
        Platform.OS === 'ios' ?
            <View style={{ flexDirection: 'row', marginBottom: 5 }}>
                <View>
                    {backButton ?
                        <TouchableOpacity underlayColor={'rgba(255, 255, 255, 0)'}
                            onPress={() => {
                                navigation.goBack();
                            }}
                            style={{ alignContent: 'center', justifyContent: 'center', zIndex: 2, width: 60, height: 80 }}
                        >
                            {Platform.OS === 'ios' ?
                                <Icon
                                    name="chevron-left"
                                    color="white"
                                    type='feather'
                                    size={35}
                                    style={{ marginTop: 4, marginLeft: -3, alignSelf: 'flex-start' }}
                                />
                                :
                                <Icon
                                    name="arrow-back"
                                    color="white"
                                />
                            }
                        </TouchableOpacity >
                        : <Image
                            source={require('../assets/images/App_Icon.png')}
                            style={{
                                marginLeft: 10,
                                height: 40,
                                width: 50,
                                alignSelf: 'center',
                                marginTop: -0,
                            }}
                        />
                    }
                </View>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: 8
                    }}
                >
                    <TouchableOpacity
                        onPress={() => navigation.navigate('ShopSearch', {
                            shopSearch: true
                        })}
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
                        onPress={() => navigation.navigate('ShopSearch', {
                            shopSearch: true
                        })}
                    >
                        <Text
                            style={{
                                color: 'white',
                                fontSize: 19,
                                marginLeft: 20
                            }}
                        >
                            Zoek in shop...
						</Text>
                    </TouchableOpacity>
                </View>
            </View >
            : <Grid style={{ flexDirection: 'row' }}>
                <Row>
                    {backButton ?
                        <TouchableOpacity underlayColor={'rgba(255, 255, 255, 0)'}
                            onPress={() => {
                                navigation.goBack();
                            }}
                            style={{ alignContent: 'center', justifyContent: 'center', zIndex: 2, width: 60, height: 60 }}
                        >
                            <Icon
                                name="arrow-back"
                                color="white"
                            />
                        </TouchableOpacity >
                        : <Image
                            source={require('../assets/images/App_Icon.png')}
                            style={{
                                marginLeft: 10,
                                alignSelf: 'center',
                                marginTop: -5,
                                height: 40,
                                width: 50
                            }}
                        />
                    }
                </Row>
                <Row
                    style={{
                        flexDirection: 'row',
                        color: 'white'
                    }}
                    containerStyle={{ alignSelf: 'stretch' }}
                    keyboardShouldPersistTaps="always"
                >
                    <TouchableOpacity
                        onPress={() =>
                            navigation.navigate('ShopSearch', {
                                shopSearch: true
                            })
                        }
                    >
                        <SearchIcon
                            name="search"
                            style={{
                                color: 'white',
                                marginTop: 18,
                                marginLeft: 20
                            }}
                            size={23}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() =>
                            navigation.navigate('ShopSearch', {
                                shopSearch: true
                            })
                        }
                        style={{ justifyContent: 'center' }}
                    >
                        <Text
                            style={{
                                color: 'white',
                                fontSize: 19,
                                marginLeft: 20
                            }}
                        >
                            Zoek in shop...
					</Text>
                    </TouchableOpacity>
                </Row>
            </Grid>
    );
}

export default function ShopStack() {
    const Stack = createStackNavigator();
    const navigation = useNavigation();

    return (
        <Stack.Navigator backBehavior='none' screenOptions={{ headerShown: true, headerBackTitleVisible: false, headerTintColor: 'white' }}>
            <Stack.Screen
                options={{
                    headerLeft: () => ShopScreenHeaderLeft({ navigation, backButton: false }),
                    headerRight: () => ShopScreenHeaderRight(navigation),
                    headerTitle: () => null,
                    headerStyle: { backgroundColor: 'black' }
                }}
                name="ShopScreen"
                component={ShopScreen}
            />
            <Stack.Screen
                options={MainHeader({ navigationParam: navigation, backButton: true })}
                name="ShoppingCart"
                component={ShoppingCartScreen}
            />
            <Stack.Screen
                options={{
                    headerLeft: () => ShopScreenHeaderLeft({ navigation, backButton: true }),
                    headerRight: () => ShopScreenHeaderRight(navigation),
                    headerStyle: {
                        backgroundColor: 'black',
                    },
                    headerTitle: () => null
                }}
                name="ShopTabs"
                component={ShopTabs}
            />
            <Stack.Screen
                options={MainHeader({ navigationParam: navigation, backButton: true })}
                name="Details"
                component={DetailsScreen}
            />
            <Stack.Screen
                options={{ header: () => null }}
                name="ShopSearch"
                component={SearchScreen}
            />
            <Stack.Screen
                options={MainHeader({ navigationParam: navigation, backButton: true })}
                name="PaymentOverview"
                component={PaymentOverviewScreen}
            />
            <Stack.Screen
                options={MainHeader({ navigationParam: navigation, backButton: true })}
                name="Privacy"
                component={PrivacyScreen}
            />
            <Stack.Screen
                options={MainHeader({ navigationParam: navigation, backButton: true })}
                name="Orders"
                component={OrdersScreen}
            />
        </Stack.Navigator>
    );
}
