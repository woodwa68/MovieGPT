/* eslint-disable react-native/no-inline-styles */
/* eslint-disable @typescript-eslint/no-array-constructor */
/* eslint-disable prettier/prettier */
import axios from 'axios';
import React, { useState } from 'react';
import { View, Text, Image, Linking, TouchableOpacity } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import configs from './config';
//import KeepAwake from 'react-native-keep-awake';
//KeepAwake.activate()

const imageScale = 0.15;

const Card = (props: any): JSX.Element => {
 
  const [w, setw] = useState<number>(0);
  const [h, seth] = useState(0);
  const [actualDimensions, setActualDimensions] = useState<any>({});
  if (!props.card) return <></>;

  const style = props.card.props.style;
  const threshold = 50;
  let scale = props.pinchData ? props.pinchData * 0.8 : 1.0;
  const padding = 4;
  let closeFactor = 1;


  function getDistance(x1:number, y1:number, x2:number, y2:number) {
    let x = Math.abs( x2 - x1 )
    let y = Math.abs( y2 - y1)
    if (x > 250 || y > 250) return;

    return Math.sqrt(x * x + y * y);
  }

 
  const distance = getDistance(
    props.crosshairData.x,
    props.crosshairData.y,
    style.left - props.dimensionData.realDimensions.w / 2,
    props.dimensionData.realDimensions.h / 2 - style.top - props.dimensionData.minHeight * ((2 - 0.8) * props.pinchData - 1)
  );

  
  if (distance && distance < threshold) {
    closeFactor = 1 / (1 + (threshold - distance) / threshold);
    if (closeFactor < 0.6) closeFactor = 0.6;
    scale = scale * closeFactor;
  }

  if (props.card.poster && !w){
    Image.getSize(props.card.poster, (wi, he) => {
      setw(wi);
      seth(he);
    });
  }

  const cardJSX =
    style.width === 0 ? (
      <View style={{ alignSelf: 'flex-start' }}>
        <Text
          onLayout={(a) => {
            style.width = a.nativeEvent.layout.width < 160 ? 160 : a.nativeEvent.layout.width;
            setActualDimensions({
              h: a.nativeEvent.layout.height,
              w: a.nativeEvent.layout.width,
            });
            style.height = props.dimensionData.minHeight;
          }}
          style={{
            fontSize: 12,
            color: 'white',
            width: 'auto',
            flexBasis: 'auto',
            padding: 0,
          }}
        >
          {props.card.props.children}
        </Text>
      </View>
    ) : (
      <View
        id={'' + props.card.props.left}
        style={{
          flexDirection: 'column',
          zIndex: 5 / scale,
          ...props.card.props.style,
          left: style.left - style.width / (scale * 2),
          top: style.top - (style.height - props.dimensionData.minHeight) / (scale * 2),
          backgroundColor: 'rgba(132,132,132,' + 2.5 * (1 - closeFactor) + ')',
          width: 'auto',
          height: 'auto',
          borderRadius: 5,
          padding: padding / scale,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            width: style.width / scale,
            height: actualDimensions.h / scale,
            justifyContent: 'center',
            marginBottom: 8,
          }}
        >
          <Text
            style={{
              textAlign: 'center',
              color: 'white',
              fontSize: 12 / scale,
              borderColor: props.color,
              borderWidth: 1,
              width: actualDimensions.w / scale + 10,
              backgroundColor: 'rgba(0,0,0,.5)',
              marginTop: -4,
            }}
          >
            {props.card.props.children}
          </Text>
        </View>
        {configs.debug && (
          <Text style={{ color: 'white' }}>
            {Math.floor(style.left - props.dimensionData.realDimensions.w / 2) + ', ' + Math.floor(props.dimensionData.realDimensions.h / 2 - style.top)}
          </Text>
        )}
        <View style={{ opacity: 2 * (1 - closeFactor) }}>
          <View style={{ flexDirection: 'row' }}>
            {props.card.poster && (
              <Image
                source={{
                  uri: props.card.poster,
                  // cache: 'only-if-cached',
                }}
                style={{
                  width: w * imageScale * (1 / scale),
                  height: h * imageScale * (1 / scale),
                }}
              />
            )}

            <Text
              numberOfLines={8}
              ellipsizeMode={'tail'}
              style={{
                flex: 1,
                flexGrow: 1,
                fontSize: 7 * (1 / scale),
                textAlign: 'justify',
                paddingHorizontal: 5,
              }}
            >
              {props.card.overview}
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',

              paddingTop: 5,
              columnGap: 3 * (1 / scale),
            }}
          >
            <View
              style={{
                maxWidth: w * imageScale * (1 / scale),
                flexDirection: 'row',
                flexGrow: 1,
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                
                  fontSize: 7 * (1 / scale),
                  color: 'yellow',
                }}
              >
                {(Math.round(props.card.vote_average * 100) / 100).toFixed(2)}
              </Text>
              <Text
                style={{
                  fontSize: 12 * (1 / scale),
                  transform: [{ skewX: '-20deg' }],
                  color: 'yellow',
                }}
              >
                {'/'}
              </Text>
              <Text
                style={{
                  lineHeight: 18 * (1 / scale),
                  fontSize: 7 * (1 / scale),
                  color: 'yellow',
                  marginBottom: -18,
                }}
              >
                {' 10'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: 'blue',
                  flex: 1,
                  justifyContent: 'center',
                  paddingHorizontal: 2 * (1 / scale),
                  borderRadius: 2 * (1 / scale),
                  alignItems: 'center',
                }}
                onPress={() => {
                  if (!distance) return;
                  ReactNativeHapticFeedback.trigger('impactLight', {
                    enableVibrateFallback: true,
                    ignoreAndroidSystemSettings: false,
                  });
                  props.focus(props);
                }}
              >
                <Text style={{ color: 'white', fontSize: 6 * (1 / scale) }}>{'Map this Movie'}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: 'green',
                  flex: 1,
                  justifyContent: 'center',
                  paddingHorizontal: 2 * (1 / scale),
                  borderRadius: 2 * (1 / scale),
                  alignItems: 'center',
                }}
                onPress={() => {
                  if (!distance) return;

                  ReactNativeHapticFeedback.trigger('impactLight', {
                    enableVibrateFallback: true,
                    ignoreAndroidSystemSettings: false,
                  });
                  debugger
                 
                  const name = props.card.props.children.toLowerCase().split(' ').join('-');
                  axios.get('https://1moviestv.com/search/' + name).then((r) => {
                    const index = r.data.indexOf('movie/watch-' + name);
                    const url = r.data.substring(index, r.data.indexOf('"', index));
                    Linking.openURL('https://1moviestv.com/' + url);
                  });
                }}
              >
                <Text style={{ color: 'white', fontSize: 6 * (1 / scale) }}>{'Watch Online'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );

  return cardJSX;
};

export default Card;
