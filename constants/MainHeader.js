/* eslint-disable react/display-name */
import React from 'react';
import {
    Image,
    Dimensions
} from 'react-native';
import DeleteIcon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function MainHeader({ navigation, deleteIcon }) {
    let header = {
        headerTitle: () => (
            <Image
                style={{
                    width: Dimensions.get('screen').width < 345 ? 350 : 230,
                    height: 37,
                }}
                resizeMode="contain"
                source={require('../assets/images/Login_Header_23.png')}
            />
        ),
        headerRight: () => (
            deleteIcon ?
                <DeleteIcon
                    style={{
                        marginRight: 15
                    }}
                    color={'white'}
                    name="delete"
                    size={25}
                    onPress={() => {
                        navigation.state.params._hideOrder();
                    }}
                />
                : null
        ),
        headerStyle: {
            backgroundColor: 'black'
        },
        headerTitleStyle: { textAlign: 'center' },
        headerTitleAlign: { alignSelf: 'center' }
    }
    return header;
}