import React from 'react';
import MapboxGL from '@mapbox/react-native-mapbox-gl';
import distance from '@turf/distance';
import lineChunk from '@turf/line-chunk';
import { point, lineString } from '@turf/helpers';
import carIcon from './icons/ic_directions_car.png';

const layerStyles = MapboxGL.StyleSheet.create({
  icon: {
    iconImage: carIcon,
    iconSize: 1,
  },
});

// These values will impact directly on the resources usage and performance
const animateEachKilometers = 0.01;
const animationTimeInterval = 50;
const mapFlights = 5; // how many times do you want to change the viewport the map to center the icon

export default class MapIconAnimation extends React.Component {
  state = {
    iconPosition: null,
    atPosition: 0,
  }

  componentWillMount() {
    this.setState({
      iconPosition: MapboxGL.geoUtils.makeFeatureCollection([
        MapboxGL.geoUtils.makePoint(this.props.coordinates[0])
      ]),
      points: lineChunk(lineString(this.props.coordinates), animateEachKilometers)
        .features
        .reduce((acc, feature) => acc.concat(feature.geometry.coordinates), [])
    });
    this.startAnimation();
  }

  _timerId = 0;

  startAnimation() {
    this._timerId = setInterval(() => {
      const { atPosition, points } = this.state;

      if (atPosition < points.length - 1) {
        this.setState({
          atPosition: atPosition + 1,
          iconPosition: MapboxGL.geoUtils.makeFeatureCollection([
            MapboxGL.geoUtils.makePoint(points[atPosition + 1])
          ]),
        });
        if (this.props.map && atPosition % (points.length / mapFlights) === 0) {
          this.props.map.flyTo(points[atPosition + 1], 22000);
        }
      } else {
        clearInterval(this._timerId);
      }
    }, animationTimeInterval);
  }

  componentWillUnmount() {
    clearInterval(this._timerId);
  }

  render() {
    const { iconPosition } = this.state;
    return (
      <MapboxGL.Animated.ShapeSource id='symbolCarIcon' shape={iconPosition}>
        <MapboxGL.Animated.SymbolLayer
          id='symbolCarLayer'
          minZoomLevel={1}
          style={layerStyles.icon} />
      </MapboxGL.Animated.ShapeSource>
    )
  }
}