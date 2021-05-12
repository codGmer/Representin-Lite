/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    BackHandler,
    ActivityIndicator,
    Dimensions,
    TouchableOpacity,
    FlatList,
    Share,
    Platform,
    Modal,
    Pressable,
    Alert
} from 'react-native';
import * as Network from 'expo-network';
import * as WebBrowser from 'expo-web-browser';
import ImageViewer from 'react-native-image-zoom-viewer';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import YoutubePlayer from "react-native-youtube-iframe";
import { Header } from '@react-navigation/stack';
import Icon2 from 'react-native-vector-icons/MaterialCommunityIcons';
import GetApiListData from '../api/GetApiListData';
import * as Linking from 'expo-linking';
import { Button, Divider, Icon } from 'react-native-elements';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import MapView from 'react-native-maps';
import WinArrow from 'react-native-vector-icons/AntDesign';
import openMap from 'react-native-open-maps';
import Icon4 from 'react-native-vector-icons/MaterialCommunityIcons';
import { Row, Grid } from 'react-native-easy-grid';
import HTMLView from 'react-native-htmlview';
import { Snackbar } from 'react-native-paper';
import HeaderImageScrollView, {
    TriggeringView
} from 'react-native-image-header-scroll-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Animatable from 'react-native-animatable';
import { SliderBox } from "react-native-image-slider-box";
import ReportError from '../api/ReportError';
import ApiFavorites from '../api/ApiFavorites';
import ActionResultAlert from '../components/ActionResultAlert';
import InsertNameModal from '../components/InsertNameAlert';
import NumericInput from 'react-native-numeric-input';

const MIN_HEIGHT = Header.HEIGHT;

export default function DetailsScreen({ navigation, route }) {

    const [mapRegion, setMapRegion] = useState({
        latitude: 0,
        longitude: 0,
        latitudeDelta: 0.02,
        longitudeDelta: 0.01
    });
    const [userLocation, setUserLocation] = useState([]);
    const [Lat, setLat] = useState(0);
    const [Lng, setLng] = useState(0);
    const [activeWinItems, setActiveWinItems] = useState([]);
    const [visible, setVisible] = useState(false);
    const [participateInWinSnackText, setParticipateInWinSnackText] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dataSource, setDataSource] = useState([]);
    const [hidden, setHidden] = useState(false);
    const [position, setPosition] = useState(0);
    const [interval, setStateInterval] = useState(null);
    const [productItems, setProductItems] = useState([]);
    const [images, setImages] = useState([]);
    const [changedImagePosition, setChangedImagePosition] = useState(false);
    const [maxProductAmountModal, setMaxProductAmountModal] = useState(false);
    const [succesRemovedModal, setSuccesRemovedModal] = useState(false);
    const [succesInsertedModal, setSuccesInsertedModal] = useState(false);
    const [fillNameModalVisible, setFillNameModalVisible] = useState(false);
    const [tempFirstName, setTempFirstName] = useState('');
    const [tempLastName, setTempLastName] = useState('');
    const [outOfStockProducts, setOutOfStockProducts] = useState(false);
    const [favorite, setFavorite] = useState(false);
    const [index, setIndex] = useState(0)
    const [modalVisible, setModalVisible] = useState(false)
    const [modalImageList, setModalImageList] = useState([]);
    const [networkType, setNetWorkType] = useState('')

    const isFirstRun2 = useRef(true);
    const navTitleView = useRef(true);
    const busyUpdating = useRef(false);
    const busyRefreshing = useRef(false);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View
                    style={{
                        flexDirection: 'row',
                        marginLeft:
                            Dimensions.get('screen').width < 345 ? 25 : 0
                    }}
                >
                    {route.params.Shop ?
                        <React.Fragment>
                            <TouchableOpacity
                                style={{
                                    marginRight: 8,
                                    paddingBottom: 3,
                                    paddingLeft:
                                        Dimensions.get('screen').width < 345
                                            ? 3
                                            : 0,
                                    width:
                                        Dimensions.get('screen').width < 345
                                            ? 30
                                            : 40,
                                    marginLeft:
                                        Dimensions.get('screen').width < 345
                                            ? 10
                                            : 0,
                                }}
                            >
                                <Icon
                                    name={'shopping-cart'}
                                    size={25}
                                    color="white"
                                    underlayColor={'rgba(255, 255, 255, 0)'}
                                    onPress={() => navigation.navigate('Shop', { screen: 'ShoppingCart' })}
                                />
                            </TouchableOpacity>
                        </React.Fragment>
                        :
                        <React.Fragment>
                            <TouchableOpacity
                                style={{
                                    paddingRight:
                                        Dimensions.get('screen').width < 345
                                            ? 3
                                            : 0,
                                    paddingTop: 6,
                                    paddingBottom: 3,
                                    paddingLeft:
                                        Dimensions.get('screen').width < 345
                                            ? 3
                                            : 0,
                                    width: 30,
                                    marginLeft:
                                        Dimensions.get('screen').width < 345
                                            ? 10
                                            : 0,
                                    height: 50,
                                    justifyContent: 'center',
                                }}
                                onPress={() => toggleFav(route.params.Id)}
                            >
                                <Icon
                                    name={
                                        favorite ? 'favorite'
                                            : 'favorite-border'
                                    }
                                    type={'material'}
                                    size={25}
                                    color='white'
                                    underlayColor={'rgba(255, 255, 255, 0)'}
                                    iconStyle={{
                                        textShadowColor: 'rgba(0, 0, 0, 0.4)',
                                        textShadowOffset: {
                                            width: 0,
                                            height: 1
                                        },
                                        textShadowRadius: 0.5
                                    }}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{
                                    justifyContent: 'center',
                                    paddingBottom: 3,
                                    width: 32,
                                    height: 50,
                                    marginTop: 2
                                }}
                                onPress={() =>
                                    _OnShare()
                                }
                            >
                                <Icon2
                                    name={'share'}
                                    size={25}
                                    color='white'
                                    underlayColor={'rgba(255, 255, 255, 0)'}
                                    style={{
                                        textShadowColor: 'rgba(0, 0, 0, 0.4)',
                                        textShadowRadius: 0.5,
                                        textShadowOffset: {
                                            width: 0,
                                            height: 1
                                        },
                                        alignSelf: 'center'
                                    }}
                                />
                            </TouchableOpacity>
                        </React.Fragment>
                    }
                </View>
            ),
        });
    }, [navigation, favorite]);

    useEffect(() => {
        if (busyUpdating.current) {
            busyUpdating.current = false;
        }
        if (busyRefreshing.current) {
            busyRefreshing.current = false;
        }
    }, [productItems])

    useEffect(() => {
        async function isFavorite() {
            let favorites = await AsyncStorage.getItem('Favorites');
            let favoriteList = JSON.parse(favorites);
            setFavorite(favoriteList.includes(parseInt(route.params.Id)));
        }

        async function init() {
            if (loading) {
                let networkState = await Network.getNetworkStateAsync();
                setNetWorkType(networkState.type)
                if (networkState.isInternetReachable && networkState.isConnected) {
                    isFavorite()
                    AsyncStorage.getItem('userLocation').then(Value => {
                        let localUserLocation = JSON.parse(Value);
                        if (localUserLocation != 'null' && Value != null) {
                            setUserLocation(localUserLocation);
                        } else {
                            setUserLocation('');
                            _getItemDetails();
                        }
                    });
                } else {
                    //apparaat offline
                    Alert.alert('U heeft momenteel geen internet verbinding, controleer deze en probeer opnieuw');
                    navigation.goBack();
                }
            }
        }

        const unsubscribe = navigation.addListener('focus', () => {
            if (!loading) {
                busyRefreshing.current = true;
                _getItemDetails();
            }
        });

        BackHandler.addEventListener(
            'hardwareBackPress',
            _handlebackpress
        );

        function _getItemDetails() {
            try {
                SecureStore.getItemAsync('userData').then(async data => {
                    let userID = JSON.parse(data);
                    let responseJson = await GetApiListData._fetchRequest(
                        {
                            action: 'getItemDetails',
                            itemID: route.params.Id,
                            userID: userID.UserID
                        })
                    let imageList = [];
                    let modalImageList = [];
                    try {
                        if (responseJson !== '404' && responseJson[0]) {
                            imageList = [
                                responseJson[0]
                                    .Soort !== '0'
                                    ?
                                    eventUri + responseJson[0].Foto
                                    :
                                    toDoUri + responseJson[0].Foto

                            ]
                            modalImageList = [
                                {
                                    url: responseJson[0]
                                        .Soort !== '0'
                                        ?
                                        eventUri + responseJson[0].Foto
                                        :
                                        toDoUri + responseJson[0].Foto

                                }
                            ]
                        }
                        for (const key in responseJson[0]) {
                            if (
                                (key == 'Foto1' && responseJson[0][key]) ||
                                (key == 'Foto2' && responseJson[0][key]) ||
                                (key == 'Foto3' && responseJson[0][key]) ||
                                (key == 'Foto4' && responseJson[0][key]) ||
                                (key == 'Foto5' && responseJson[0][key]) ||
                                (key == 'Foto6' && responseJson[0][key])
                            ) {
                                if (eventUri +
                                    responseJson[0][key] !== imageList[0]) {
                                    imageList.push(
                                        eventUri +
                                        responseJson[0][key]
                                    )
                                    modalImageList.push(
                                        {
                                            url: eventUri +
                                                responseJson[0][key]
                                        }
                                    )
                                }
                            }
                        }
                        setImages(imageList)
                        setModalImageList(modalImageList)
                        setStateInterval(setInterval(
                            () => {
                                if (!changedImagePosition) {
                                    setPosition(
                                        position ===
                                            Object.keys(images)
                                                .length -
                                            1 || position === 0
                                            ? 0
                                            : position + 1
                                    );
                                }
                                else {
                                    setChangedImagePosition(false)
                                }
                            },
                            Object.keys(images).length > 4
                                ? 3000
                                : 4000
                        ))
                        _calculateDistance(responseJson[0]);
                        setMapRegion({
                            latitude: parseFloat(responseJson[0].Lat),
                            longitude: parseFloat(responseJson[0].Lng),
                            latitudeDelta: 0.02,
                            longitudeDelta: 0.01
                        });
                        setLat(parseFloat(responseJson[0].Lat));
                        setLng(parseFloat(responseJson[0].Lng));
                        if (responseJson.length > 1 && responseJson[1].length > 0) {
                            let outOfStock = true;
                            responseJson[1].forEach(product => {
                                if ((product.OutOfStock === '0' && product.StockCurrent > 0) && ((product.ReservationEnabled == 1 && product.ResStockAvb > 0) || product.ReservationEnabled == 0)) {
                                    outOfStock = false;
                                }
                            })
                            setOutOfStockProducts(outOfStock);
                            setProductItems(responseJson[1]);
                        }
                    } catch (error) {
                        console.log(error);
                        ReportError._reportError(1020, error);
                        navigation.goBack();
                    }
                })
            } catch (error) {
                console.log(error)
                ReportError._reportError(1024, error);
            }
        }

        if (Object.values(userLocation).length === 0 && loading) {
            init()
        } else if (Object.values(userLocation).length > 0 && loading) {
            _getItemDetails();
        }

        return function cleanup() {
            BackHandler.removeEventListener(
                'hardwareBackPress',
                _handlebackpress
            );
            clearInterval(interval);
            unsubscribe();
        }
    }, [userLocation, navigation, loading])

    useEffect(() => {
        if (isFirstRun2.current) {
            isFirstRun2.current = false;
            return;
        } else if (images.length > 0 && Object.entries(dataSource).length > 0 && networkType !== '') {
            setLoading(false)
        }
    }, [dataSource, images, networkType])

    function _openMaps(adress) {
        openMap({ query: adress });
    }

    function _handlebackpress() {
        navigation.goBack();
        return true;
    }

    function _OnShare() {
        try {
            let removedSpaces = route.params.Titel.split(' ').join('-');
            let title = route.params.Titel.split('-').join(' ');
            Share.share({
                title: title.trim(),
                message:
                    'Check ' +
                    title.trim() +
                    ' in de Representin app: ' +
                    'https://www.representin.nl/app/' +
                    removedSpaces +
                    '?Id=' +
                    route.params.Id
            });
        } catch (error) {
            console.log(error);
            ReportError._reportError(
                2084,
                'onshare error' +
                error,
                true
            );
        }
    }

    function _closeSuccesWinInsertedModal() {
        setSuccesInsertedModal(false);
    }

    function _openSuccesWinInsertedModal() {
        setSuccesInsertedModal(true);
    }

    function _closeWinRemovedModal() {
        setSuccesRemovedModal(false);
    }

    function _closeNameModal() {
        setFillNameModalVisible(false);
    }

    async function toggleFav(ID) {
        let response = await ApiFavorites._updateFavorite(ID);
        await AsyncStorage.setItem('Favorites', JSON.stringify(response), () => {
            if (favorite) {
                setFavorite(false);
            } else {
                setFavorite(true);
            }
        })
    }

    function _pushItemToCart(propertyID, value) {
        busyUpdating.current = true;
        SecureStore.getItemAsync('userData').then(async data => {
            let userID = JSON.parse(data);
            let responseJson = await GetApiListData._fetchRequest(
                {
                    action: 'pushItemToCart',
                    userID: userID.UserID,
                    item: JSON.stringify(dataSource),
                    propertyID,
                    amount: value
                })
            if (responseJson.Result === '1') {
                _onChange(
                    propertyID,
                    parseInt(responseJson.CurrentAmount) || 0
                );
            } else if (responseJson.Result === '-1') {
                setMaxProductAmountModal(true);
                _onChange(propertyID, parseInt(responseJson.CurrentAmount));
            } else if (responseJson.Result === '0') {
                ReportError._reportError(
                    5050,
                    'Dubbele order open of ander probleem ' +
                    responseJson.Result
                );
                _onChange(propertyID, parseInt(responseJson.CurrentAmount));
            }
        })
    }

    function _onChange(index, newVal) {
        setProductItems(productItems.map((product) =>
            product.PropertyID === index ? { ...product, Amount: newVal } : product
        ))
    }

    function _saveUserNameData() {
        SecureStore.getItemAsync('userData').then(async data => {
            let userData = JSON.parse(data);
            let responseJson = await GetApiListData._fetchRequest(
                {
                    action: 'saveUserDetails',
                    userID: userData.UserID,
                    firstName: tempFirstName,
                    lastName: tempLastName
                })
            if (responseJson === '1') {
                _insertActiveWinItemFromUser()
                _closeNameModal();
                _openSuccesWinInsertedModal();
            } else {
                Alert.alert('Niet gelukt!');
            }
        });
    }

    function _calculateDistanceTwoPoints(uLat, uLng, fLat, fLng) {
        //uLat = user latitude
        //fLat = popular latitude

        var R = 6371; // km
        //has a problem with the .toRad() method below.
        var x1 = fLat - uLat;
        var dLat = _toRad(x1);
        var x2 = fLng - uLng;
        var dLon = _toRad(x2);
        var a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(_toRad(uLat)) *
            Math.cos(_toRad(fLat)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c;
        return Math.round(d * 10) / 10;
    }

    function _calculateDistance(itemList) {
        if (itemList.WinId !== '') {
            setActiveWinItems([...activeWinItems, itemList.WinId])
        }
        if (Object.values(userLocation).length > 0 && itemList.Lat !== '0') {
            let distance = _calculateDistanceTwoPoints(
                userLocation.coords.latitude,
                userLocation.coords.longitude,
                itemList.Lat,
                itemList.Lng
            );
            distance !== '' && distance < 200
                ? (itemList.distance = distance)
                : (itemList.distance = '-');
        } else {
            itemList.distance = '-';
        }
        setDataSource(itemList);
    }

    function _toRad(Value) {
        /** Converts numeric degrees to radians */
        return (Value * Math.PI) / 180;
    }

    function _checkIfEmpty() {
        let test = productItems.filter((item) => { return item.Amount == 0 });
        if (test.length == productItems.length) {
            return true;
        } else {
            return false;
        }
    }

    function _closeMaxProductAmountModal() {
        setMaxProductAmountModal(false)
    }

    function _toggleActiveWinItems(item) {
        const id = item;
        if (_isActiveWinItems(id)) {
            setActiveWinItems(activeWinItems.filter(a => a !== id))
            _deleteActiveWinItemFromUser(id);
        } else {
            setActiveWinItems([...activeWinItems, id])
            _insertActiveWinItemFromUser(id)
        }
    }

    function _insertActiveWinItemFromUser(id) {
        SecureStore.getItemAsync('userData').then(async data => {
            let userID = JSON.parse(data);
            let responseJson = await GetApiListData._fetchRequest(
                {
                    action: 'insertActiveWinItemFromUser',
                    userID: userID.UserID,
                    winItem: id
                }
            )
            if (responseJson == 1) {
                setParticipateInWinSnackText('Gelukt, Je doet nu mee met de winactie!')
                AsyncStorage.setItem('Favorites', JSON.stringify(activeWinItems));
                setVisible(true)
            } else if (responseJson == 0) {
                setParticipateInWinSnackText('Er ging iets fout, neem contact met ons op!')
                setVisible(true)
            }
        })
    }

    function _openUrl(url) {
        let link = url.replace(' ', '');
        if (!link.includes('http')) {
            link = 'http://' + link;
        }
        WebBrowser.openBrowserAsync(link);
    }

    async function _onShareImage() {
        // try {
        let fileUri = images[index];
        let fileName = fileUri.replace(/^.*[\\\/]/, '');

        let uri = await FileSystem.downloadAsync(
            fileUri,
            FileSystem.documentDirectory + fileName
        )
        Sharing.shareAsync(uri.uri, {
            dialogTitle: 'Deel deze foto met je vrienden'
        });
    }

    function _deleteActiveWinItemFromUser(id) {
        SecureStore.getItemAsync('userData').then(async data => {
            let userID = JSON.parse(data);
            let responseJson = await GetApiListData._fetchRequest(
                {
                    action: 'DeleteActiveWinItemFromUser',
                    userID: userID.UserID,
                    winItem: id
                }
            )

            if (responseJson == 1) {
                setParticipateInWinSnackText('Gelukt, Je bent uitgeschreven voor de winactie!')
                setVisible(true)
            } else if (responseJson == 0) {
                setParticipateInWinSnackText('Er ging iets fout, neem contact met ons op!')
                setVisible(true)

            } else {
                setParticipateInWinSnackText('Er ging iets fout, neem contact met ons op!')
            }
        })
    }

    function _isActiveWinItems(item) {
        const id = item;
        return activeWinItems.includes(id);
    }

    function _renderItem({ item, index }) {
        let outOfStock;
        if ((item.StockCurrent < 1 || item.OutOfStock > 0 || item.ProductOutOfStock == 1) &&
            item.StockCurrent !== '' && item.StockCurrent !== 'undefined' || (item.ReservationEnabled == 1 && item.ResStockAvb < 1)) {
            outOfStock = true;
        }
        return (
            <React.Fragment>
                {index !== 0 ? <Divider style={{ backgroundColor: 'black', width: '100%', marginTop: 10, marginBottom: 10 }} /> : null}
                <View style={{ flexDirection: 'row' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', width: '68%', marginTop: 10 }}>

                        {(outOfStock ?

                            <View style={{ flexDirection: 'column' }}>
                                <Text style={{
                                    fontSize: 17,
                                    color: 'red',
                                    fontWeight: 'bold',
                                    textDecorationLine: 'line-through'
                                }}>{item.Name + ' €' + item.Price}</Text>
                            </View>

                            :

                            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>

                                <Text style={{ fontSize: 17 }}>
                                    {item.Name + ' '}
                                </Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                    {item.OldPrice > 0 ?
                                        (<Text
                                            style={{
                                                color: 'grey',
                                                fontSize: 18,
                                                textDecorationLine:
                                                    'line-through',
                                                width: 'auto'
                                            }}
                                        >
                                            {parseFloat(
                                                item.OldPrice
                                            ) % 1
                                                ? '€ ' +
                                                parseFloat(
                                                    item
                                                        .OldPrice
                                                ).toFixed(2)
                                                : '€ ' +
                                                parseFloat(
                                                    item
                                                        .OldPrice
                                                )}
                                        </Text>
                                        )
                                        : null}
                                    <Text style={{ fontSize: 17 }}>{item.OldPrice > 0 ? ' € ' + item.Price : '€ ' + item.Price}</Text>
                                </View>
                            </View>
                        )}
                    </View>
                    <View style={{ width: '30%', alignItems: 'center', justifyContent: 'center' }}>
                        {!outOfStock ?
                            <NumericInput
                                onChange={(value) => {
                                    if (parseInt(value) !== parseInt(item.Amount)) {
                                        if (!busyUpdating.current) {
                                            if ((item.ReservationEnabled == '1' && value <= item.ResStockAvb) || item.ReservationEnabled == 0) {
                                                _pushItemToCart(item.PropertyID, value)
                                            } else {
                                                setMaxProductAmountModal(true);
                                            }
                                        } else {
                                            let newValue = item.Amount;
                                            if (newValue > value) {
                                                newValue--;
                                            } else {
                                                newValue++;
                                            }
                                            _onChange(item.PropertyID, newValue);
                                        }
                                    }
                                }
                                }
                                rounded
                                totalHeight={40}
                                totalWidth={100}
                                editable={false}
                                minValue={0}
                                containerStyle={{ alignSelf: 'flex-end' }}
                                style={{ alignSelf: 'flex-end' }}
                                initValue={parseInt(item.Amount)}
                            />
                            : <Text style={{ fontSize: 17, color: 'red' }}>Uitverkocht</Text>

                        }
                    </View>
                </View>
            </React.Fragment >
        )
    }

    let eventUri =
        'http://adminpanel.representin.nl/image.php?image=/events/Fotos/';
    let toDoUri =
        'http://adminpanel.representin.nl/image.php?image=/uitgaan/Fotos/';
    let adres =
        dataSource.Straat == ''
            ? dataSource.Locatie +
            ', ' +
            dataSource.Regio
            : typeof dataSource.Locatie !== 'undefined' &&
                dataSource.Locatie !== ''
                ? dataSource.Straat +
                ' ' +
                dataSource.Huisnummer +
                ', ' +
                dataSource.Postcode +
                ' ' +
                dataSource.Locatie
                : typeof dataSource.Regio !== 'undefined' &&
                    dataSource.Regio !== ''
                    ? dataSource.Straat +
                    ' ' +
                    dataSource.Huisnummer +
                    ', ' +
                    dataSource.Postcode +
                    ' ' +
                    dataSource.Regio
                    : dataSource.Straat +
                    ' ' +
                    dataSource.Huisnummer +
                    ', ' +
                    dataSource.Postcode +
                    ' ' +
                    dataSource.Plaatsnaam;
    if (adres == ', ') {
        adres = '';
    }
    if (loading) {
        return (
            <View style={[styles.horizontal, styles.container]}>
                <ActivityIndicator size='large' color='black' />
            </View>
        );
    } else if (Object.values(dataSource).length > 0 && !loading) {
        let video_url = (networkType == 'WIFI' ?
            dataSource.Video
            :
            dataSource.Video)
        return (
            <View
                style={styles.container}
                keyboardShouldPersistTaps='always'
            >
                <ActionResultAlert
                    animationType="slide"
                    backdropColor={'black'}
                    backdropOpacity={0.7}
                    dataSource={dataSource}
                    shoppingCartButton={true}
                    isVisible={maxProductAmountModal}
                    onRequestClose={() =>
                        _closeMaxProductAmountModal()
                    }
                    onRequestNavigate={() => { _closeMaxProductAmountModal(); navigation.navigate('ShopStack', { screen: 'ShoppingCart' }); }}
                    positive={false}
                    customTitle={'Je hebt het maximale aantal \n van dit product bereikt.'}
                />
                <ActionResultAlert
                    onRequestClose={() => _closeWinRemovedModal()}
                    isVisible={succesRemovedModal}
                    customTitle={'Uitgeschreven'}
                    customMessage={'Je bent uitgeschreven voor de winactie van ' + dataSource.Titel}
                    dataSource={dataSource}
                    positive={false}
                />
                <ActionResultAlert
                    onRequestClose={() => _closeSuccesWinInsertedModal()}
                    isVisible={succesInsertedModal}
                    customTitle={'Gelukt'}
                    customMessage={'Je bent ingeschreven voor de winactie van ' + dataSource.Titel}
                    dataSource={dataSource}
                    positive={true}
                />
                <InsertNameModal
                    isVisible={fillNameModalVisible}
                    onRequestClose={() => _closeNameModal()}
                    customTitle={'Vul jouw naam in\nom mee te doen aan winacties'}
                    dataSource={dataSource}
                    firstName={tempFirstName}
                    lastName={tempLastName}
                    saveFunc={() => _saveUserNameData()}
                    saveFirstNameChange={(firstName) => setTempFirstName(firstName)}
                    saveLastNameChange={(lastName) => setTempLastName(lastName)}
                />
                <View>
                    <Modal
                        visible={modalVisible}
                        transparent={true}
                        onRequestClose={() => {
                            setModalVisible(false)
                        }}
                    >
                        <View
                            style={{
                                position: 'absolute',
                                zIndex: 1,
                                left: 15,
                                top: Platform.OS === 'ios' ? 40 : 20,
                                height: 40,
                                width: '100%',
                                flexDirection: 'row'
                            }}
                        >
                            <TouchableOpacity
                                onPress={() => {
                                    setModalVisible(false)
                                }}
                                style={{
                                    height: 40
                                }}
                            >
                                <Icon
                                    name={'arrow-back'}
                                    size={24}
                                    color={'white'}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => _onShareImage()}
                                style={{
                                    height: 40,
                                    position: 'absolute',
                                    right: 40
                                }}
                            >
                                <Icon2
                                    name={'share'}
                                    size={24}
                                    color={'white'}
                                />
                            </TouchableOpacity>
                        </View>
                        <ImageViewer
                            renderIndicator={(currentIndex, allSize) => <Text style={{ position: 'absolute', top: Platform.OS === 'ios' ? 42 : 22, alignSelf: 'center', color: 'white' }}>{currentIndex + '/' + allSize}</Text>}
                            index={index}
                            imageUrls={modalImageList}
                            enableSwipeDown={true}
                            onSwipeDown={() =>
                                setModalVisible(false)
                            }
                            onChange={index => {
                                setIndex(index)
                            }}
                            onSave={() => { }}
                            menuContext={{
                                saveToLocal: 'Opslaan',
                                cancel: 'Annuleren'
                            }}
                        />
                    </Modal>
                </View>
                <HeaderImageScrollView
                    maxHeight={180}
                    minHeight={80}
                    fadeOutForeground
                    maxOverlayOpacity={0.5}
                    minOverlayOpacity={0.0}
                    keyboardShouldPersistTaps='always'
                    renderTouchableFixedForeground={() => (
                        <Animatable.View
                            ref={navTitleView}
                        >
                            <SliderBox
                                images={images}
                                sliderBoxHeight={180}
                                onCurrentImagePressed={index => {
                                    setIndex(index);
                                    setModalVisible(true);
                                }}
                                autoplay
                                circleLoop
                                dotColor="rgb(255,187,0)"
                                inactiveDotColor="grey"
                                paginationBoxStyle={{ top: -150, position: 'absolute' }}
                                parentWidth={Dimensions.get('screen').width}
                            />
                            <View
                                style={
                                    hidden
                                        ? {
                                            position: 'absolute',
                                            top: 0,
                                            width: '100%',
                                            zIndex: 1
                                        }
                                        : {
                                            position: 'absolute',
                                            bottom: 0,
                                            width: '100%',
                                            zIndex: 1
                                        }
                                }
                            >
                                <LinearGradient
                                    colors={[
                                        'rgba(0,0,0,0.9)',
                                        'transparent'
                                    ]}
                                    start={{ x: 0, y: 1 }}
                                    end={{ x: 0, y: 0 }}
                                    style={{
                                        height: 80,
                                        width: '100%',
                                        paddingLeft: 10,
                                        paddingRight: 10,
                                        paddingBottom:
                                            dataSource
                                                .Locatie !== '' ||
                                                dataSource
                                                    .Plaatsnaam !== ''
                                                ? Dimensions.get('window')
                                                    .width < 340
                                                    ? 0
                                                    : 30
                                                : 30
                                    }}
                                >
                                    {dataSource.Geenadres !==
                                        '1' ? (
                                        <Text
                                            style={{
                                                fontSize: 12,
                                                color: 'white',
                                                width: 'auto',
                                                fontWeight: 'bold',
                                                marginTop: 12,
                                                backgroundColor: 'black',
                                                left: 10,
                                                position: 'absolute',
                                                paddingRight: 2,
                                                paddingLeft: 2,
                                                shadowColor: '#000',
                                                shadowOffset: {
                                                    width: 0,
                                                    height: 5
                                                },
                                                shadowOpacity: 0.34,
                                                shadowRadius: 6.27,

                                                elevation: 15
                                            }}
                                        >
                                            {dataSource
                                                .distance + ' KM'}
                                        </Text>
                                    ) : null}
                                    <Text
                                        style={{
                                            fontSize:
                                                dataSource.Titel.length > 35
                                                    ? 18
                                                    : 20,
                                            marginTop: 28,
                                            height: 25,
                                            color: 'white',
                                            fontWeight: 'bold',
                                            textShadowColor:
                                                'rgba(0, 0, 0, 0.4)',
                                            textShadowOffset: {
                                                width: -1,
                                                height: 1
                                            },
                                            textShadowRadius: 10,
                                            elevation: 22
                                        }}
                                    >
                                        {dataSource.Titel}
                                    </Text>

                                    <Text
                                        style={{
                                            fontSize: 14,
                                            color: 'white',
                                            textShadowColor:
                                                'rgba(0, 0, 0, 0.4)',
                                            textShadowOffset: {
                                                width: -1,
                                                height: 1
                                            },
                                            textShadowRadius: 10,
                                            elevation: 22
                                        }}
                                    >
                                        {dataSource.Geenadres !==
                                            '1'
                                            ? dataSource
                                                .Locatie !== '' ||
                                                dataSource
                                                    .Plaatsnaam !== ''
                                                ? dataSource
                                                    .Regio == '' &&
                                                    dataSource
                                                        .Locatie == '' &&
                                                    dataSource
                                                        .Plaatsnaam == ''
                                                    ? dataSource
                                                        .Datum_Begin +
                                                    ' om ' +
                                                    dataSource
                                                        .BeginTime
                                                    : dataSource
                                                        .Regio !== ''
                                                        ? dataSource
                                                            .Datum_Begin +
                                                        ' om ' +
                                                        dataSource
                                                            .BeginTime +
                                                        ' | ' +
                                                        dataSource
                                                            .Locatie +
                                                        dataSource
                                                            .Plaatsnaam +
                                                        ', ' +
                                                        dataSource
                                                            .Regio
                                                        : dataSource
                                                            .Datum_Begin +
                                                        ' om ' +
                                                        dataSource
                                                            .BeginTime +
                                                        ' | ' +
                                                        dataSource
                                                            .Locatie +
                                                        dataSource
                                                            .Plaatsnaam
                                                : ''
                                            : dataSource
                                                .Datum_Begin +
                                            ' om ' +
                                            dataSource
                                                .BeginTime}
                                    </Text>
                                </LinearGradient>
                            </View>
                        </Animatable.View>
                    )}
                >
                    <TriggeringView
                        style={styles.section}
                        onHide={() => {
                            setHidden(true)
                        }}
                        onDisplay={() => {
                            setHidden(false)
                        }}
                    />
                    <View
                        style={{
                            paddingLeft: 5,
                            paddingRight: 5,
                            paddingBottom: 5
                        }}
                    >
                        <View
                            style={{
                                borderWidth: 1,
                                borderTopWidth: 0,
                                paddingLeft: 10,
                                paddingRight: 10,
                                paddingBottom: 10,
                                borderColor: 'transparent'
                            }}
                        >
                            {(dataSource.Telefoonnummer !== '' && typeof dataSource.Telefoonnummer !== 'undefined') || (dataSource.Link !== '' && typeof dataSource.Link !== 'undefined') ?
                                <View style={{ width: '100%', height: 35, marginTop: 10, justifyContent: 'flex-end', alignItems: 'flex-end', flexDirection: 'row', marginBottom: dataSource.Geannuleerd ? -10 : -35, marginRight: 10 }}>
                                    {dataSource.Telefoonnummer !== '' && typeof dataSource.Telefoonnummer !== 'undefined' ?
                                        <TouchableOpacity onPress={() => Linking.openURL('tel:' + dataSource.Telefoonnummer)} style={{ height: 40, width: 35, zIndex: 1, justifyContent: 'center' }} ><Icon
                                            name={'phone-call'}
                                            type={'feather'}
                                            size={25}
                                        /></TouchableOpacity>
                                        : null}
                                    {dataSource.Link !== '' && typeof dataSource.Link !== 'undefined' && dataSource.Link !== 'http://' ?
                                        <TouchableOpacity onPress={() => _openUrl(dataSource.Link)} style={{ height: 40, width: 35, zIndex: 1, justifyContent: 'center' }}>
                                            <Icon
                                                name={'link'}
                                                type={'feather'}
                                                size={25}
                                            />
                                        </TouchableOpacity>
                                        : null}
                                </View>
                                : null}
                            <View
                                style={{
                                    justifyContent: 'center',
                                    alignContent: 'center',
                                    flex: 1
                                }}
                            >
                                {typeof dataSource.WinTitle !==
                                    'undefined' &&
                                    dataSource.WinTitle !== '' &&
                                    dataSource.Status !== '0' && !route.params.Shop ? (
                                    <Grid>
                                        <Row style={{ height: 50, alignItems: 'center' }}>
                                            <Text
                                                style={{
                                                    fontSize: 15,
                                                    color: 'black',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                {
                                                    dataSource
                                                        .WinTitle
                                                }
                                            </Text>
                                            <WinArrow
                                                name={'caretright'}
                                                size={20}
                                                color='black'
                                            />
                                            <Pressable
                                                style={{
                                                    width: 120,
                                                    height: 40,
                                                    backgroundColor: 'black',
                                                    justifyContent: 'center',
                                                    borderRadius: 5,
                                                    marginLeft: 'auto',
                                                    marginTop: 20,
                                                    zIndex: 1
                                                }}
                                                android_ripple={{ color: 'white', borderless: false }}
                                                onPress={() => {
                                                    _toggleActiveWinItems(
                                                        dataSource.Id
                                                    )
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontWeight: 'bold',
                                                        color: 'white',
                                                        textAlign: 'center',
                                                        fontSize: 17
                                                    }}
                                                >
                                                    {_isActiveWinItems(
                                                        dataSource.Id
                                                    )
                                                        ? 'Uitschrijven'
                                                        : 'Meedoen'}
                                                </Text>
                                            </Pressable>
                                        </Row>
                                        {dataSource.WinEndDate !== '' && typeof dataSource.WinEndDate !== 'undefined' && dataSource.WinEndDate !== null && typeof dataSource.WinTitle !==
                                            'undefined' &&
                                            dataSource.WinTitle !== '' &&
                                            dataSource.Status !== '0' && !route.params.Shop ?
                                            <Text style={{ marginTop: -15 }}>{'Winnaar wordt bekend gemaakt\nuiterlijk op ' + dataSource.WinEndDate}</Text>
                                            : null}
                                    </Grid>
                                ) : null}
                            </View>
                            {dataSource.Geannuleerd == 1 ? (
                                <Text
                                    style={{
                                        fontSize: 16,
                                        color: 'white',
                                        width: '100%',
                                        fontWeight: 'bold',
                                        marginTop: 10,
                                        backgroundColor: 'red',
                                        padding: 2,
                                        shadowColor: '#000',
                                        shadowOffset: {
                                            width: 0,
                                            height: 5
                                        },
                                        shadowOpacity: 0.34,
                                        shadowRadius: 6.27,

                                        elevation: 5
                                    }}
                                >
                                    {
                                        'Let op! Deze activiteit is geannuleerd.'
                                    }
                                </Text>
                            ) : null}
                            {dataSource.Geenadres ==
                                '1' ? null : (
                                <Text
                                    style={{
                                        fontSize: 15,
                                        marginTop: 10,
                                        marginBottom: 10,
                                        color: 'grey'
                                    }}
                                >
                                    Locatie
                                </Text>
                            )}
                            {dataSource.Geenadres ==
                                '1' || userLocation.length == 0 ? null : (
                                <MapView
                                    style={{
                                        alignSelf: 'stretch',
                                        height: 200
                                    }}
                                    pitchEnabled={false}
                                    rotateEnabled={false}
                                    scrollEnabled={false}
                                    zoomEnabled={false}
                                    region={mapRegion}
                                    initialRegion={mapRegion}
                                    containerStyle={{ zIndex: 1 }}
                                >
                                    <MapView.Marker
                                        coordinate={{
                                            latitude: Lat,
                                            longitude: Lng,
                                            latitudeDelta: 0.1,
                                            longitudeDelta: 0.1
                                        }}
                                        Title={dataSource.Titel}
                                    >
                                        <Image
                                            source={
                                                dataSource
                                                    .Soort !== '0'
                                                    ? {
                                                        uri:
                                                            eventUri + dataSource.Foto
                                                    }
                                                    : {
                                                        uri:
                                                            toDoUri + dataSource.Foto
                                                    }
                                            }
                                            style={{
                                                width: 50,
                                                height: 50
                                            }}
                                        />
                                    </MapView.Marker>
                                </MapView>
                            )}
                            {dataSource.Geenadres ==
                                '1' ? null : (
                                <Text size={12}>{adres}</Text>
                            )}
                            {dataSource.Geenadres ==
                                '1' ? null : (
                                <View
                                    style={{
                                        position: 'absolute',
                                        top:
                                            typeof dataSource
                                                .WinTitle !== 'undefined' &&
                                                dataSource
                                                    .WinTitle !== '' &&
                                                dataSource.Status !==
                                                '0'
                                                ? 270
                                                : 200,
                                        right: 13,
                                        flex: 1
                                    }}
                                >
                                    <Icon4
                                        name='google-maps'
                                        size={30}
                                        color='black'
                                        underlayColor='white'
                                        onPress={() => {
                                            if (adres !== '') {
                                                _openMaps(adres);
                                            } else {
                                                Alert.alert(
                                                    'Geen locatie bekend!'
                                                );
                                            }
                                        }}
                                    />
                                </View>
                            )}
                            <Text
                                style={{
                                    fontSize: 15,
                                    marginTop: 10,
                                    marginBottom: 10,
                                    color: 'grey'
                                }}
                            >
                                Info
                                    </Text>
                            <HTMLView
                                value={
                                    '<div>' +
                                    dataSource.Omschrijving +
                                    '</div>'
                                }
                                stylesheet={styles}
                            />
                            {dataSource.Commencement != '' ? (
                                <Text
                                    style={{
                                        fontSize: 15,
                                        marginTop: 10,
                                        marginBottom: 10,
                                        color: 'grey'
                                    }}
                                >
                                    Aanvang
                                </Text>
                            ) : null}
                            {dataSource.Commencement != '' ? (
                                <Text style={{ fontSize: 17 }}>
                                    {dataSource.Commencement}
                                </Text>
                            ) : null}
                            {dataSource.Datum_Eind != '' ? (
                                <Text
                                    style={{
                                        fontSize: 15,
                                        marginTop: 10,
                                        marginBottom: 10,
                                        color: 'grey'
                                    }}
                                >
                                    Einde
                                </Text>
                            ) : null}
                            {dataSource.Datum_Eind != '' ? (
                                <Text style={{ fontSize: 17 }}>
                                    {dataSource.Datum_Eind}
                                </Text>
                            ) : null}
                            {dataSource.Prijzen == '' ? null : (
                                <React.Fragment>
                                    <Text
                                        style={{
                                            fontSize: 15,
                                            marginTop: 10,
                                            marginBottom: 10,
                                            color: 'grey'
                                        }}
                                    >
                                        Prijzen
                                        </Text>
                                    <HTMLView
                                        value={
                                            '<div>' +
                                            dataSource.Prijzen +
                                            '</div>'
                                        }
                                        stylesheet={styles}
                                    />
                                </React.Fragment>
                            )}
                            {dataSource.Openingstijden ==
                                '' ? null : (
                                <React.Fragment>
                                    <Text
                                        style={{
                                            fontSize: 15,
                                            marginTop: 10,
                                            marginBottom: 10,
                                            color: 'grey'
                                        }}
                                    >
                                        Openingstijden
                                            </Text>
                                    <HTMLView
                                        value={
                                            '<div>' +
                                            dataSource.Openingstijden +
                                            '</div>'
                                        }
                                        stylesheet={styles}
                                    />
                                </React.Fragment>
                            )}
                            {dataSource.Video != '' ? (
                                <View
                                    renderToHardwareTextureAndroid={true}>
                                    <Text
                                        style={{
                                            fontSize: 15,
                                            marginTop: 10,
                                            marginBottom: 10,
                                            color: 'grey'
                                        }}
                                    >
                                        Video
                                    </Text>
                                    <YoutubePlayer
                                        height={200}
                                        initialPlayerParams={{ loop: true }}
                                        width={'100%'}
                                        play={networkType == 'WIFI' ? true : false}
                                        mute={true}
                                        videoId={video_url}
                                        forceAndroidAutoplay={true}
                                    />
                                </View>
                            ) : null}
                            {productItems.length > 0 ? (
                                <React.Fragment>
                                    <Text
                                        style={{
                                            fontSize: 15,
                                            marginBottom: 10,
                                            color: 'grey'
                                        }}
                                    >
                                        Producten
                                            </Text>
                                    {dataSource.ProductDetailTitle !== '' ?
                                        <Text>
                                            {dataSource.ProductDetailTitle}
                                        </Text>
                                        : null}
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flex: 1, margin: 0, flexDirection: 'column' }}>
                                            <FlatList data={productItems} style={{ flex: 1 }} keyExtractor={(item) => item.PropertyID} renderItem={_renderItem} />
                                            {dataSource.Terms !== '' && typeof dataSource.Terms !== 'undefined' ?
                                                <React.Fragment>
                                                    <Text
                                                        style={{
                                                            fontSize: 15,
                                                            marginTop: 10,
                                                            marginBottom: 10,
                                                            color: 'grey'
                                                        }}
                                                    >
                                                        Voorwaarden
                                                            </Text>
                                                    <HTMLView
                                                        value={
                                                            dataSource.Terms
                                                        }
                                                    />
                                                </React.Fragment> : null}
                                            <Button
                                                title={'Kopen'}
                                                titleStyle={{
                                                    fontSize: 20,
                                                    color: 'black',
                                                    fontWeight: 'bold',
                                                    marginTop: -4
                                                }}
                                                icon={{
                                                    name: 'shopping-cart',
                                                    type: 'feather',
                                                    color: +dataSource.ProductOutOfStock || +outOfStockProducts ? 'darkgrey' : 'black',
                                                    size: 22
                                                }}
                                                buttonStyle={{
                                                    backgroundColor: '#ffba00',
                                                    height: 40,
                                                    width: 120,
                                                    borderRadius: 5
                                                }}
                                                containerStyle={{
                                                    marginTop: 15,
                                                    marginBottom: 5,
                                                    alignSelf: 'flex-end'
                                                }}
                                                disabled={!!+dataSource.ProductOutOfStock || !!+outOfStockProducts || _checkIfEmpty()}
                                                iconRight
                                                onPress={() => navigation.navigate('Shop', { screen: 'ShoppingCart' })}
                                            />
                                        </View>
                                    </View>
                                </React.Fragment>
                            ) : null}
                        </View>
                    </View>
                </HeaderImageScrollView>
                <Snackbar
                    visible={visible}
                    onDismiss={() => setVisible(false)}
                    action={{
                        label: 'Verbergen',
                        onPress: () => setVisible(false)
                    }}
                    duration={5000}
                >
                    {participateInWinSnackText}
                </Snackbar>
            </View >
        );
    }
}

const styles = StyleSheet.create({
    div: {
        fontSize: 17
    },
    container: {
        flex: 1,
        backgroundColor: 'white',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
        elevation: 1
    },

    header: {
        alignItems: 'center',
        backgroundColor: 'black',
        width: '100%',
        height: 59,
        flexDirection: 'row'
    },

    headerLogo: {
        resizeMode: 'center'
    },

    horizontal: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 10
    },

    image: {
        height: 180,
        width: Dimensions.get('window').width,
        alignSelf: 'stretch',
        resizeMode: 'stretch',
        zIndex: 1
    },
    titleContainer: {
        flex: 1,
        alignSelf: 'stretch',
        zIndex: 9
    },
    navTitleView: {
        height: MIN_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 16,
        opacity: 0
    }
});