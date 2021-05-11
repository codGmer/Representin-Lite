/* eslint-disable react/display-name */
/* eslint-disable react/prop-types */
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DetailsScreen from '../screens/DetailsScreen';

import PrivacyScreen from '../screens/PrivacyScreen';
import AboutScreen from '../screens/AboutScreen';
import ContactScreen from '../screens/ContactScreen';
import MoreScreen from '../screens/MoreScreen';
import OrdersScreen from '../screens/OrdersScreen';
import OrderDetailsScreen from '../screens/OrderDetailsScreen';
import MainHeader from '../constants/MainHeader';

export default function MoreStack({ navigation, route }) {
    const Stack = createStackNavigator();
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: true, headerBackTitleVisible: false, headerTintColor: 'white'
            }}
            backBehavior='none'
        >
            <Stack.Screen
                options={MainHeader({ navigationParam: navigation, backButton: false })}
                name="More"
                component={MoreScreen}
            />
            <Stack.Screen
                options={MainHeader({ navigationParam: navigation, backButton: true })}
                name="Orders"
                component={OrdersScreen}
            />
            <Stack.Screen
                options={MainHeader({ navigationParam: navigation, backButton: true })}
                name="OrderDetails"
                component={OrderDetailsScreen}
            />
            <Stack.Screen
                options={MainHeader({ navigationParam: navigation, backButton: true })}
                name="MoreScreenDetails"
                component={DetailsScreen}
            />
            <Stack.Screen
                options={MainHeader({ navigationParam: navigation, backButton: true })}
                name="Privacy"
                component={PrivacyScreen}
            />
            <Stack.Screen
                options={MainHeader({ navigationParam: navigation, backButton: true })}
                name="About"
                component={AboutScreen}
            />
            <Stack.Screen
                options={MainHeader({ navigationParam: navigation, backButton: true })}
                name="Contact"
                component={ContactScreen}
            />
        </Stack.Navigator>
    );
}