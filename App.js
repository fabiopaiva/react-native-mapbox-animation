/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Text,
} from 'react-native';
import MapboxGL from '@mapbox/react-native-mapbox-gl';
import { lineString as makeLineString } from '@turf/helpers';
import { MAPBOX_ACCESS_TOKEN } from './MapboxAccessToken';

MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject
  }
});

const layerStyles = MapboxGL.StyleSheet.create({
  route: {
    lineColor: '#007aff',
    lineWidth: 5,
    lineOpacity: 0.85,
    lineJoin: MapboxGL.LineJoin.Round,
    lineCap: MapboxGL.LineCap.Round,
  },
});

const origin = 'Av. do Contorno, 6061 - São Pedro, Belo Horizonte - MG, 30110-929, Brazil';
const destination = 'Av. Augusto de Lima, 744 - Centro, Belo Horizonte - MG, 30190-922, Brazil';


export default class App extends Component {
  state = {
    centerCoordinate: null,
    error: null,
    route: null,
  }

  _mapRef;

  componentWillMount() {
   this.getDirections();
  }

  async getDirections() {
    try {
      const response = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}`)
      const data = await response.json();

      if (data.status === 'OK') {
        if (data.routes && data.routes.length && data.routes[0].legs.length) {
          const route = data.routes[0];
          if (route.legs.length) {
            const leg = route.legs[0];
            const centerCoordinate = [leg.start_location.lng, leg.start_location.lat];
            const coordinates = leg.steps.reduce((acc, step) => {
              acc.push([step.start_location.lng, step.start_location.lat]);
              acc.push([step.end_location.lng, step.end_location.lat]);
              return acc;
            }, []);

            this.setState({ centerCoordinate, route: makeLineString(coordinates) });

            if (this._mapRef) {
              this._mapRef.fitBounds(
                [leg.start_location.lng, leg.start_location.lat],
                [leg.end_location.lng, leg.end_location.lat]
              );
            }
          }
        }
      }
    }
    catch(error) {
      this.setState({ error: error.toString() + JSON.stringify(error) })
    }
  }

  render() {
    const { centerCoordinate, error, route } = this.state;
    if (error) return <Text>{error}</Text>

    return (
      <View style={styles.container}>
        <MapboxGL.MapView
          ref={(ref) => { this._mapRef = ref }}
          style={styles.map}
          centerCoordinate={centerCoordinate}
        >
        {route && (
          <MapboxGL.ShapeSource id='routeSource' shape={route}>
            <MapboxGL.LineLayer id='routeFill' style={layerStyles.route} />
          </MapboxGL.ShapeSource>
        )}
        </MapboxGL.MapView>
      </View>
    );
  }
}