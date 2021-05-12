/* eslint-disable react/prop-types */
import React, { useEffect } from 'react';
import {
    View,
    Text,
    BackHandler,
    ScrollView
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import FbIcon from 'react-native-vector-icons/AntDesign';
import InstaIcon from 'react-native-vector-icons/AntDesign';
import { Col, Grid, Row } from 'react-native-easy-grid';

export default function ContactScreen({ navigation }) {

    useEffect(() => {
        BackHandler.addEventListener('hardwareBackPress', handleBackPress);
        // this.props.navigation.setParams({ setRange: this._onSave})

        return function cleanUp() {
            BackHandler.removeEventListener(
                'hardwareBackPress',
                handleBackPress
            );
            //console.log('unmount')
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
                            <Text style={{ marginTop: 10, fontSize: 16 }}>
                                Contact{'\n'}
                                {'\n'}
                                    Ons team staat altijd voor jou klaar! Heb
                                    jij een algemene vraag?{'\n'}
                                    Stuur dan een email naar info@representin.nl
                                    ! Je kunt van ons zo spoedig als mogelijk
                                    een reactie verwachten. Je kunt ook ons
                                    natuurlijk ook een berichtje via Facebook of
                                    Instagram sturen, dat lezen wij ook!
                                </Text>
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

    async function _handlePressButtonAsyncInsta() {
        await WebBrowser.openBrowserAsync(
            'https://www.instagram.com/representinnl/'
        );
    }

    async function _handlePressButtonAsync() {
        await WebBrowser.openBrowserAsync(
            'https://www.facebook.com/representinnl/'
        );
    }

    function handleBackPress() {
        navigation.goBack();
        return true;
    }
}
