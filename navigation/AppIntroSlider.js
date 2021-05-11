import React, { useState, useContext } from 'react';
import {
    StyleSheet,
    Alert,
    View,
    Text,
    Platform,
    Image,
} from 'react-native';
import * as Location from 'expo-location';
import AppIntroSlider from 'react-native-app-intro-slider';
import { ExtraProps } from "../context/context";
import AsyncStorage from '@react-native-async-storage/async-storage';

const slides = [
    {
        key: 'welcome',
        title: 'Welkom',
        text:
            'Met deze app blijf je op de hoogte van de beste party’s, events en uitjes bij jou in de buurt, kun je tickets winnen en partypictures downloaden.',
        image: require('../assets/images/Demo_Welkom.jpg'),
        imageStyle: { height: 300, width: 300 }
    },
    {
        key: 'location',
        title: 'Locatie',
        text:
            'Geef toestemming voor jouw locatie. \n Het aanbod van deze app wordt afgestemd op jouw omgeving.',
        image: require('../assets/images/Demo_Locatie.jpg'),
        imageStyle: {
            height: 300,
            width: 300,
            resizeMode: 'contain'
        }
    },
    {
        key: 'account',
        title: 'Maak een account aan',
        text:
            'Het is noodzakelijk dat jij een gratis account aan maakt, hiermee kun je onder andere gewonnen tickets in ontvangst nemen.',
        image: require('../assets/images/Demo_Account.jpg'),
        imageStyle: {
            height: 300,
            width: 250,
            resizeMode: 'contain'
        }
    }
];

export default function AppIntroSliderScreen() {
    const [showNextButton, setShowNextButton] = useState(true);
    const [showDoneButton, setShowDoneButton] = useState(false);
    const [scrollEnabled, setScrollEnabled] = useState(false);
    const [slideIndex, setSlideIndex] = useState('');
    const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);

    const extraProps = useContext(ExtraProps);

    async function _askLocationPermission() {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            setLocationPermissionGranted(false);
            _checkLocationPermission();
        } else {
            setShowNextButton(true);
            setLocationPermissionGranted(true);
            setScrollEnabled(true);
            setShowDoneButton(true);
        }
    }

    async function _askPermission() {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'undetermined') {
            setShowNextButton(false);
            setLocationPermissionGranted(false);
            setScrollEnabled(false);
            setShowDoneButton(false);
            Alert.alert(
                'Locatie',
                'Geef toegang tot je locatie voor deze app. Deze wordt enkel gebruikt binnen de app om jouw aanbod te personaliseren.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            _askLocationPermission();
                        }
                    }
                ],
                { cancelable: false }
            );
        } else if (status == 'denied' && Platform.OS === 'ios') {
            setShowNextButton(true);
            setLocationPermissionGranted('ios');
            setScrollEnabled(true);
            setShowDoneButton(true);
        } else if (status == 'denied' && Platform.OS === 'android') {
            Alert.alert(
                'Locatie',
                'Geef toegang tot je locatie voor deze app. Deze wordt enkel gebruikt binnen de app om jouw aanbod te personaliseren.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            _askLocationPermission();
                        }
                    }
                ],
                { cancelable: false }
            );
        } else if (status == 'granted') {
            setShowNextButton(true);
            setLocationPermissionGranted(true);
            setScrollEnabled(true);
            setShowDoneButton(true);
            console.log('getting Location intro slider...')
            await Location.getLastKnownPositionAsync().then(value => {
                if (value == '') {
                    AsyncStorage.setItem(
                        'userLocation',
                        JSON.stringify({
                            coords: {
                                accuracy: 0,
                                altitude: 0,
                                heading: 0,
                                latitude: 0,
                                longitude: 0,
                                speed: 0
                            }
                        })
                    );
                } else {
                    AsyncStorage.setItem('userLocation', JSON.stringify(value));
                }
            });
        }
    }

    async function _checkLocationPermission() {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            setShowNextButton(false);
            setTimeout(async () => {
                _askPermission();
            }, 2200);
            return false;
        } else if (status === 'granted') {
            setShowNextButton(true);
            setScrollEnabled(true);
            setLocationPermissionGranted(true);
            setShowDoneButton(true);
            return true;
        }
    }

    function _renderItem({ item }) {
        return (
            <View style={styles.slide}>
                <Text style={styles.title}>{item.title}</Text>
                <Image style={item.imageStyle} source={item.image} />
                <Text style={styles.text}>{item.text}</Text>
            </View>
        );
    }

    function _setIntroPassed() {
        AsyncStorage.setItem('introPassed', 'true', () => {
            extraProps.introPassed(true);
            extraProps.locationPermission(true);
        });
    }

    const styles = StyleSheet.create({
        slide: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'space-around',
            backgroundColor: 'black'
        },
        text: {
            color: 'rgba(255, 255, 255, 0.8)',
            backgroundColor: 'transparent',
            textAlign: 'center',
            paddingHorizontal: 16,
            marginBottom: 60
        },
        title: {
            fontSize: 22,
            color: 'white',
            backgroundColor: 'transparent',
            textAlign: 'center',
        },
    });

    return (
        <React.Fragment>
            <AppIntroSlider
                onDone={() => {
                    if (locationPermissionGranted || locationPermissionGranted === 'ios') {
                        _setIntroPassed()
                    } else {
                        _askPermission()
                    }
                }}
                data={slides}
                renderItem={_renderItem}
                dotClickEnabled={false}
                scrollEnabled={scrollEnabled}
                showPrevButton={true}
                showDoneButton={showDoneButton}
                showNextButton={showNextButton}
                nextLabel={'Volgende'}
                doneLabel={'Klaar'}
                prevLabel={'Vorige'}
                onSlideChange={index => {
                    setSlideIndex(index);
                    if (index == 1) {
                        setShowNextButton(false);
                        _checkLocationPermission();
                    } else if (index == 0) {
                        setShowNextButton(true);
                    }
                }}
                dotStyle={{ backgroundColor: 'grey' }}
            />
        </React.Fragment>
    );
}