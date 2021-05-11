import React, { useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    BackHandler,
    ScrollView,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import FbIcon from 'react-native-vector-icons/AntDesign';
import InstaIcon from 'react-native-vector-icons/AntDesign';
import { Col, Grid, Row } from 'react-native-easy-grid';

export default function AboutScreen({ navigation }) {

    useEffect(() => {
        function init() {
            BackHandler.addEventListener('hardwareBackPress', handleBackPress);
            // this.props.navigation.setParams({ setRange: this._onSave})
        }

        init();

        return function cleanUp() {
            BackHandler.removeEventListener(
                'hardwareBackPress',
                handleBackPress
            );
        }
    }, [])

    return (
        <ScrollView
            style={{
                elevation: 5,
                marginTop: 5
            }}
        >
            <View
                style={{
                    paddingLeft: 5,
                    paddingRight: 5,
                    paddingBottom: 5
                }}
            >
                <View
                    style={{
                        elevation: 3,
                        borderWidth: 1,
                        borderTopWidth: 0,
                        paddingLeft: 10,
                        paddingRight: 10,
                        paddingBottom: 10,
                        borderColor: 'transparent'
                    }}
                >
                    <View
                        style={{
                            justifyContent: 'center',
                            alignContent: 'center',
                            flex: 1
                        }}
                    >
                        <Grid>
                            <Row>
                                <Text
                                    style={{ marginTop: 10, fontSize: 16 }}
                                >
                                    Representin.nl is dé uitgaansagenda van
                                    Limburg en bied jou een actueel en
                                    compleet aanbod van party's, events en
                                    activiteiten bij jou in de buurt.
                                        {'\n'}
                                    {'\n'}
                                        Je maakt kans op gratis tickets voor
                                        vele events en activiteiten, dus doe mee
                                        en test je geluk! Wie niet waagt, wie
                                        niet wint.
                                        {'\n'}
                                    {'\n'}
                                        Ben je op een event geweest? Grote kans
                                        dat één van onze fotografen jou en jouw
                                        maatjes op de foto heeft gezet. Download
                                        jouw partypicture gratis en deel hem met
                                        jouw vrienden.
                                        {'\n'}
                                    {'\n'}
                                        Ons team komt op de vetste events en wij
                                        zijn altijd op zoek naar gemotiveerde
                                        collega's die willen meebouwen aan dit
                                        super leuke project. Ook bieden wij de
                                        mogelijk om stage bij ons te lopen.
                                        {'\n'}
                                    {'\n'}
                                        Wil je meer informatie? Stuur
                                        vrijblijvend een mailtje naar
                                        jobs@representin.nl of kom langs.
                                        {'\n'}
                                    {'\n'}
                                        Deze app is ontwikkeld door: Nick
                                        Vaessens.
                                        {'\n'}
                                    {'\n'}
                                        Volg ons ook op Social Media als je
                                        up-2-date wilt blijven!
                                    </Text>
                            </Row>
                            <Row>
                                <Col style={{ width: 40 }}>
                                    <FbIcon
                                        name={'facebook-square'}
                                        onPress={() =>
                                            _handlePressButtonAsync()
                                        }
                                        size={28}
                                    />
                                </Col>
                                <Col>
                                    <InstaIcon
                                        name={'instagram'}
                                        onPress={() =>
                                            _handlePressButtonAsyncInsta()
                                        }
                                        size={28}
                                    />
                                </Col>
                            </Row>
                        </Grid>
                    </View>
                </View>
            </View>
        </ScrollView>
    );

    async function _handlePressButtonAsync() {
        await WebBrowser.openBrowserAsync(
            'https://www.facebook.com/representinnl/'
        );
    }

    async function _handlePressButtonAsyncInsta() {
        await WebBrowser.openBrowserAsync(
            'https://www.instagram.com/representinnl/'
        );
    }

    function handleBackPress() {
        navigation.goBack();
        return true;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        //marginTop: Constants.statusBarHeight,
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
        elevation: 1
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
        height: 40,
        flexDirection: 'row',
        justifyContent: 'center'
    },

    headerLogo: {
        resizeMode: 'center'
    }
});
