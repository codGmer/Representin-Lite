import React, { useState, useEffect, useRef } from 'react';
import MapView, { Circle } from 'react-native-maps';
import { StyleSheet, View, ActivityIndicator, Text, Platform, Alert, Dimensions } from 'react-native';
import { Slider } from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as location from 'expo-location';
import Constants from 'expo-constants';
import ErrorBoundary from 'react-native-error-boundary'

const width = Dimensions.get('window').width;

export default function GpsDistanceScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [kilometer, setKilometer] = useState(100);
    const [region, setRegion] = useState({});
    const isFirstRun = useRef(true);
    const isFirstRun2 = useRef(true);
    const mapViewRef = useRef(null);

    useEffect(() => {
        async function findLocation() {
            let permission = await location.requestForegroundPermissionsAsync();
            if (permission.granted) {
                let userLocation = await location.getCurrentPositionAsync({
                    accuracy:
                        !Constants.isDevice && Platform.OS === 'android'
                            ? 3
                            : location.Accuracy.Balanced
                });
                let filterValue = await AsyncStorage.getItem('filterValue');
                let inputValue = JSON.parse(filterValue);
                if (userLocation != null && userLocation != [] && inputValue != null) {
                    setKilometer(parseInt(inputValue));
                    setRegion(regionFrom(userLocation.coords.latitude, userLocation.coords.longitude, inputValue))
                } else if (inputValue == null) {
                    await AsyncStorage.setItem('filterValue', '100', () => {
                        if (userLocation != null && userLocation != []) {
                            setKilometer(100);
                            setRegion(regionFrom(userLocation.coords.latitude, userLocation.coords.longitude, 100))
                        } else {
                            Alert.alert('Oops', 'Er ging iets mis met de locatie ophalen, check je apparaat locatie instellingen')
                        }
                    })
                }
            } else {
                Alert.alert('Oops', 'Voor deze functie moet er toestemming worden gegeven voor uw locatie')
                navigation.goBack();
            }
        }
        findLocation();
    }, []);

    useEffect(() => {
        async function checkIfDone() {
            if (typeof region !== 'undefined' && Object.entries(region).length > 0 && kilometer > 0) {
                console.log('klaar met laden');
                setLoading(false);
            }
        }
        if (isFirstRun.current) {
            isFirstRun.current = false;
        } else if (loading) {
            checkIfDone();
        }
    }, [kilometer, loading, region]);

    useEffect(() => {

        function changeRegion() {
            //console.log('changing region')
            let re = regionFrom(region.latitude, region.longitude, kilometer);
            setRegion(re)
            if (mapViewRef) {
                mapViewRef.current.animateToRegion(
                    re,
                    500
                );
            }
        }
        if (isFirstRun2.current) {
            isFirstRun2.current = false;
        } else {
            if (!loading) {
                changeRegion();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [kilometer])

    function regionFrom(lat, long, distance) {
        distance = distance * 5.5;
        distance = distance / 2;
        const circumference = 40075;
        const oneDegreeOfLatitudeInMeters = 111.32;
        const angularDistance = distance / circumference;
        const latitudeDelta = distance / oneDegreeOfLatitudeInMeters;
        const longitudeDelta = Math.abs(
            Math.atan2(
                Math.sin(angularDistance) * Math.cos(lat),
                Math.cos(angularDistance) - Math.sin(lat) * Math.sin(lat)
            )
        );
        return ({
            latitude: lat,
            longitude: long,
            latitudeDelta,
            longitudeDelta
        });
    }

    const errorHandler = (error, stackTrace) => {
        AsyncStorage.setItem('error', JSON.stringify({ error }));
    }

    async function storeData(value) {
        try {
            await AsyncStorage.setItem('filterValue', value.toString());
        } catch (error) {
            console.log(error + 'didnt save userlocation');
        }
    }

    if (loading || typeof kilometer === 'undefined' || kilometer === null) {
        return (
            <View style={[styles.horizontal, styles.container]}>
                <ActivityIndicator size="large" color='white' />
            </View>
        )
    } else {
        return (
            <ErrorBoundary onError={errorHandler}>
                <View style={{ flex: 1, backgroundColor: 'black' }}>
                    <MapView
                        ref={mapViewRef}
                        style={{
                            alignSelf: 'stretch',
                            flex: 1
                        }}
                        pitchEnabled={false}
                        rotateEnabled={false}
                        scrollEnabled={false}
                        zoomEnabled={false}
                        initialRegion={region}
                        containerStyle={{ zIndex: 1 }}
                    >
                        <Circle
                            key={(region.latitude + region.longitude).toString()}
                            center={{
                                latitude: region.latitude,
                                longitude: region.longitude
                            }}
                            radius={kilometer * 1000}
                            strokeWidth={1}
                            strokeColor={'rgba(90, 90, 90, 0.4)'}
                            fillColor={'rgba(90, 90, 90, 0.3)'}
                        >
                        </Circle>
                        <MapView.Marker
                            coordinate={region}
                        />
                    </MapView>
                </View>
                <View style={{ height: 70, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' }}>
                    <Slider
                        style={{ width: width - 50 }}
                        step={10}
                        minimumValue={10}
                        maximumValue={100}
                        minimumTrackTintColor='rgb(255, 255, 255)'
                        maximumTrackTintColor='rgba(128,128,128, 0.3)'
                        thumbTintColor='rgb(255, 255, 255)'
                        animationType='timing'
                        animateTransitions={false}
                        value={kilometer}
                        onValueChange={(value) => setKilometer(parseInt(value))}
                        onSlidingComplete={(value) => storeData(value)}
                    />
                    <View style={styles.textCon}>
                        <Text style={styles.colorGrey}>10 km</Text>
                        <Text style={{ color: kilometer < 100 ? 'rgb(255, 187, 0)' : 'white' }}>
                            {kilometer !== 100
                                ? '< ' + kilometer + ' km'
                                : 'Alles'}
                        </Text>
                    </View>
                </View >
            </ErrorBoundary>
        )
    }
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
    },
    header: {
        alignItems: 'center',
        backgroundColor: 'black',
        width: '100%',
        height: 50,
        flexDirection: 'row',
        justifyContent: 'center'
    },
    headerLogo: {
        resizeMode: 'center'
    },
    textCon: {
        width: width - 40,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    colorGrey: {
        color: '#d3d3d3'
    },
});