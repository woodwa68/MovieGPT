/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable prettier/prettier */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, SafeAreaView ,Image} from 'react-native';
import { Dimensions } from 'react-native';
import Card from './Card';

import { useSharedValue } from 'react-native-reanimated';

import axios from 'axios';
import SearchBar from 'react-native-search-bar';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';

import Svg, { LinearGradient, Line, Defs, Stop } from 'react-native-svg';
import configs from './config';

const background = require ('./vector.jpg');
const DIMENSIONS_W = Dimensions.get('window').width * 2;
const DIMENSIONS_H = Dimensions.get('window').height;

const App = (): JSX.Element => {
  const [elements, setElements] = useState<any>({});
  const [cards, setCards] = React.useState<any>(null);
  const [Aid, setAid] = useState<any>(null);
  const [map, setMap] = React.useState<GnodMap | null>(null);
  const [search, setSearch] = useState('Interstellar');
  const [searchCount, setSearchCount] = useState(0);
  const zoomRef = useRef<any>(null);

  useEffect(() => {
    const findMovie = async (movie: string) => {
      return await axios.get('https://api.themoviedb.org/3/search/movie?api_key=0c72404af55a481d897ee326078734d6&language=en-US&query=' + movie).then((r) => {
        return r.data.results[0];
      });
    };
    
    axios.get('https://api.themoviedb.org/3/configuration?api_key=0c72404af55a481d897ee326078734d6&language=en-US').then((r) => {
      const base_url = r.data.images.secure_base_url;
      const size = 'w342';

      axios.get('https://www.movie-map.com/' + search).then((r) => {
        let data = r.data.substring(r.data.indexOf('<script>var NrWords='), r.data.indexOf('</script>', r.data.indexOf('<script>var NrWords=')));

        let movies = r.data.split('</a>')
          .map((el: string) => {
            if (el.includes('class=S')) return el.split('>')[1];
            return;
          }).slice(3, -1);

        movies.unshift(search);

        data = data.replace('<script>', '').replace('</script>', '');
        // eslint-disable-next-line no-new-func
        const aid = new Function(data + ';return Aid;')();
        setAid(aid);

        const elements2: any = {};
        for (let i = 0; i < 49; i++) {
          elements2['s' + i] = {
            props: {
              style: {
                position: 'absolute',
                width: 0,
                height: 0,
                left: 0,
                top: 0,
                color: 'black',
              },
              children: movies[i],
            },
          };
        }

        movies.map(async (movie: any, i: number) => {
          if (i > 20) return;

          const movieData = await findMovie(movie);

          elements2['s' + i] = {
            ...elements2['s' + i],
            poster: base_url + size + movieData.poster_path,
            ...movieData,
          };
        });

        setElements(elements2);
      });
    });
  }, [searchCount]);


  useEffect(() => {
    if (!elements['s0']) return;

    if (map) map.stop = true;
    setRealDimensions({ h: DIMENSIONS_H, w: DIMENSIONS_W });
    zoomRef.current.moveBy(-crosshairX.value * zoomL.value, crosshairY.value * zoomL.value);

    const newMap = new GnodMap();
    setMap(newMap);
    newMap.updateScale();
  }, [elements]);

  const minHeight = 50;
  const [realDimensions, setRealDimensions] = useState<any>({});
  const crosshairX = useSharedValue<any>(0);
  const crosshairY = useSharedValue<any>(0);
  const crosshairSize = 10;
  const crosshairThickness = 2;
  const searchBarRef = useRef<any>(null);
  const defaultZoom = 0.8;
  const zoomL = useSharedValue<any>(defaultZoom);
  const colors = ['#9D72FF', '#FFB3FD', '#01FFFF', '#01FFC3', '#FDF200'];
  const getGradient = (id: number, x: number, y: number, x2: number, y2: number, card: any) => {
    if (card.style === 'none') return;

    return (
      <LinearGradient
        key={'grad' + id + x2}
        id={'grad' + id}
        x1={x2 > x ? 0 : '100%'}
        y1={y2 > y ? 0 : '100%'}
        x2={x2 > x ? '100%' : 0}
        y2={y2 > y ? '100%' : 0}
      >
        <Stop offset='0%' stopColor='black' stopOpacity='1' />
        <Stop offset='35%' stopColor={colors[id % colors.length]} stopOpacity='1' />
        <Stop offset='65%' stopColor={colors[id % colors.length]} stopOpacity='1' />
        <Stop offset='100%' stopColor='black' stopOpacity='1' />
      </LinearGradient>
    );
  };

  const mainApp = (
    <>
      <View
        style={{
          position: 'absolute',
          left: DIMENSIONS_W / 2 / 2 - crosshairSize / 2,
          top: DIMENSIONS_H / 2 - crosshairThickness / 2,
          backgroundColor: 'white',
          height: crosshairThickness,
          width: crosshairSize,
          zIndex: 999999,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: DIMENSIONS_W / 2 / 2 - crosshairThickness / 2,
          top: DIMENSIONS_H / 2 - crosshairSize / 2,
          backgroundColor: 'white',
          height: crosshairSize,
          width: crosshairThickness,
          zIndex: 999999,
        }}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
        {configs.debug && (
          <Text style={{ position: 'absolute', left: 50, top: 50, zIndex: 9999999, color: 'white' }}>
            {parseInt(crosshairX.value) + ', ' + parseInt(crosshairY.value)}
          </Text>
        )}
        <SearchBar
          ref={searchBarRef}
          placeholder='Search a Movie'
          barTintColor='#222222'
          tintColor='white'
          textColor='white'
          text={search}
          textFieldBackgroundColor='#444444'
          hideBackground={false}
          barStyle='default'
          searchBarStyle='minimal'
          showsCancelButtonWhileEditing={true}
          onChangeText={(e) => setSearch(e)}
          onSearchButtonPress={() => {
            setSearchCount(searchCount + 1);
            searchBarRef.current.unFocus();
          }}
          style={{ height: 100, backgroundColor:'black' }}
        />
        
        <Image style={{zIndex:-1,opacity:.3,position:'absolute',width:DIMENSIONS_W, height:DIMENSIONS_H}} source={background}/>

        <ReactNativeZoomableView
          maxZoom={1.65}
          minZoom={defaultZoom}
          initialZoom={defaultZoom}
          ref={zoomRef}
          bindToBorders={false}
          onZoomAfter={(a, b, c) => {
            zoomL.value = c.zoomLevel;
            crosshairX.value = -c.offsetX;
            crosshairY.value = c.offsetY;
          }}
          onShiftingAfter={(a, b, c) => {

            crosshairX.value = -c.offsetX;
            crosshairY.value = c.offsetY;
            return true;
          }}
          style={{ height: DIMENSIONS_H, width: DIMENSIONS_W, top: zoomRef.current ? -zoomRef.current.state.originalPageY : 0 }}
        >
          <Svg height={DIMENSIONS_H} width={'100%'} style={{ top: minHeight / 2 / zoomL.value, position: 'absolute' }}>
            <Defs>
              {cards &&
                cards.map((card: any, i: number) => {
                  return getGradient(i, cards[0].props.style.left, cards[0].props.style.top, cards[i].props.style.left, cards[i].props.style.top, card.props);
                })}
            </Defs>
            {cards &&
              cards.map((card: any, i: number) => {
                if (card.props.style.display === 'none') {
                  return;
                }

                const x1 = cards[i].props.style.left;
                const x2 = cards[0].props.style.left;
                const y1 = cards[i].props.style.top;
                const y2 = cards[0].props.style.top;

                return (
                  <Line key={'' + i + x1 + y1} x1={x1} y1={y1} x2={x2} y2={y2} stroke={'url(#grad' + i + ')'} opacity={0.5} strokeWidth={3 / zoomL.value} />
                );
              })}
          </Svg>
          {cards &&
            cards.map((card: any) => {
              if (card.props.style === 'none') return null;
              return (
                <Card
                  key={card.props.children}
                  pinchData={zoomL.value}
                  props={card}
                  focus={(movieCard: any) => {
                    setSearch(movieCard.props.props.children);
                    setSearchCount(searchCount + 1);
                    movieCard.props.props.style.left;
                  }}
                  dimensionData={{ minHeight, realDimensions }}
                  crosshairData={{
                    x: crosshairX.value,
                    y: crosshairY.value,
                  }}
                ></Card>
              );
            })}
        </ReactNativeZoomableView>
      </SafeAreaView>
    </>
  );

  class mg_2d_element {
    x: number;
    id: number;
    y: number;
    speedX: number;
    speedY: number;
    element: any;
    width: any;
    height: any;
    inertia: number;
    fixed: boolean;

    constructor(id: number) {
      this.id = id;
      this.x = 0;
      this.y = 0;
      this.speedX = 0;
      this.speedY = 0;
      this.element = elements['s' + this.id];

      this.width = this.element.props.style.width;
      this.height = this.element.props.style.height;
      this.inertia = 0.7;
      this.fixed = false; // if the element is pinned
    }

    update(damper: number) {
      this.element.props.style.left = this.x - this.element.props.style.width / 2;
      this.element.props.style.top = this.y - this.element.props.style.height / 2;

      //this.element.props.style.scale = scale.value;

      if (!this.fixed) {
        this.x += this.speedX / damper;
        this.y += this.speedY / damper;
      }
      this.speedX *= this.inertia;
      this.speedY *= this.inertia;
    }
  }

  function repelItem(
    item1: { x: number; y: number; width: any; height: any; fixed: any; element: any },
    item2: { x: number; y: number; width: any; height: any; element: any },
    force: number
  ) {
    const dx = item1.x - item2.x;
    const dy = item1.y - item2.y;

    const extentsSumX = (item1.element.props.style.width + item2.element.props.style.width) / 2;
    const extentsSumY = (item1.element.props.style.height + item2.element.props.style.height) / 2;

    const right = -dx + extentsSumX;
    const left = dx + extentsSumX;
    const down = -dy + extentsSumY;
    const up = dy + extentsSumY;

    if (left < 0 || right < 0 || up < 0 || down < 0) return;

    let moveX = right;
    if (left < right) moveX = -left;
    let moveY = down;
    if (up < down) moveY = -up;

    const xy_ratio = Math.abs(moveX) / Math.abs(moveY);
    if (xy_ratio < 1) moveY *= xy_ratio * xy_ratio;
    else moveX /= xy_ratio * xy_ratio;

    if (!item1.fixed) {
      item1.x += moveX * force;
      item1.y += moveY * force;
    }
  }

  class GnodMap {
    public stop = false;
    public aid: any[] = []; // aid[i1][i2]: proposed similarity between the two items i1, i2.
    public maxItems = 0; // max. number of items to draw. if set to 0, dimension of aid[] is used.

    public left = 0; // left border of drawing area
    public top = 0; // top border of drawing area
    public bottom = 0; // bottom border, automatically detected if not set.
    public right = 0; // right border, automatically detected if not set.
    public padding = 1; // padding in px added to the boundaries. defaults to 1px to remove extends by rounding

    public offsetX = 80; // x displace central item
    public offsetY = 0; // y displace central item
    public scaleFactor = 1.4; // scaling in respect to calculated window space
    public scaleByCenterDist = -1; // scaling in respect to mean target center distance (mean aid[i][0])

    public frameDelayInitial = 25; // initial value of increasing delay at each timestep
    public slowdownCycle = 300; // number of timesteps after that delay is increased

    public inertia = 0.7; // part of velocity kept in one timestep
    public damperInitial = 1; // initial value of increasing damper that cool down motion with time
    public damperFactor = 1.002; // factor the damper is increased by in one timestep
    public damperMax = 100; // max. value of damper
    public springForce0 = 0.025; // force between each item and the central item s0 trying to keep them at aid[][]-distance
    public springForce = 0.005; // force between each item pair except the central item s0
    public centeringForce = 0.1; // force that pulls the center of gravity towards the central item

    public repelDelay = 150; // nr. of timesteps without repulsion
    public repelIncrease = 0.01; // amount the repelling force that keeps items non overlapping increases each timestep
    public repelMax = 0.5; // max amount of repelling force.

    public items: any[] = []; // holds the items
    public nrItems = 20; // number of items to layout
    public maxX: any = 0;
    public maxY: any = 0;
    public minX: any = 0;
    public minY = 0; // bounds of drawing area
    public scaleX: any = 0;
    public scaleY: any = 0; // scale to make anything fit
    public cogX: any = 0;
    public cogY: any; // center of gravity of all items
    public cycle = 0; // refresh cycle counter
    public frameDelay: any; // delay between redraws
    public damper: any; // increasing damper to cool down motion
    public repel: any; // increasing force that repells items to not overlap each other

    public limitNrItems() {

      let limit = 20;
      if (limit > this.items.length) limit = this.items.length;
      this.nrItems = limit;
      for (let i = 0; i < this.items.length; i++) {
        if (i >= this.nrItems) this.items[i].element.props.style.display = 'none';
        else this.items[i].element.props.style.display = 'flex';
      }
    }

    public updateBoundaries() {
      this.minX = 0;
      this.minY = 0;

      this.maxX = DIMENSIONS_W;
      this.maxY = DIMENSIONS_H;
    }

    public getMeanItemSize() {
      let meanW = 0,
        meanH = 0;
      for (let i = 1; i < this.nrItems; i++) {
        meanW += this.items[i].element.props.style.width;
        meanH += this.items[i].element.props.style.height;
      }
      meanW /= this.nrItems;
      meanH /= this.nrItems;

      return { width: meanW, height: meanH };
    }

    public updateScale() {
      let scale = this.scaleFactor * (1 + this.scaleByCenterDist * this.meanTargetCenterDistance());
      const meanSize = this.getMeanItemSize();

      if (!scale) scale = 0.2; 

      this.scaleX = (this.maxX - this.minX - meanSize.width) * scale;
      this.scaleY = (this.maxY - this.minY - meanSize.height) * scale;
    }

    public resetItemPositions() {
      this.updateBoundaries();

      this.items = [];
      this.items.push(new mg_2d_element(0));

      this.items[0].x = this.minX + (this.maxX - this.minX) / 2;
      this.items[0].y = this.minY + (this.maxY - this.minY) / 2;

      if (this.offsetX) this.items[0].x += this.offsetX;
      if (this.offsetY) this.items[0].y += this.offsetY;

      for (let i = 1; i < this.aid.length; i++) {
        this.items[i] = new mg_2d_element(i);
        this.items[i].inertia = this.inertia;

        this.items[i].x = this.items[0].x + Math.sin(i);
        this.items[i].y = this.items[0].y + Math.cos(i);
      }

      this.limitNrItems();

      this.updateScale();

      this.cogX = this.items[0].x;
      this.cogY = this.items[0].y;
      this.cycle = 0;
      this.frameDelay = this.frameDelayInitial;
      this.damper = this.damperInitial;
      this.repel = 0;
    }

    public recenterItems() {
      const forceX = (this.items[0].x - this.cogX) * this.centeringForce;
      const forceY = (this.items[0].y - this.cogY) * this.centeringForce;
      for (let i = 1; i < this.nrItems; i++) {
        if (!this.items[i].fixed) {
          this.items[i].x += forceX;
          this.items[i].y += forceY;
        }
      }
    }

    public updateItems() {
      this.cogX = 0;
      this.cogY = 0;

      for (let i = 0; i < this.nrItems; i++) {
        const w = this.items[i].element.props.style.width / 2;
        const h = this.items[i].element.props.style.height / 2;
        if (this.items[i].x + w > this.maxX) this.items[i].x = this.maxX - w;
        if (this.items[i].x - w < this.minX) this.items[i].x = this.minX + w;
        if (this.items[i].y + h > this.maxY) this.items[i].y = this.maxY - h;
        if (this.items[i].y - h < this.minY) this.items[i].y = this.minY + h;

        this.cogX += this.items[i].x;
        this.cogY += this.items[i].y;

        this.items[i].update(this.damper);
      }

      this.cogX /= this.nrItems;
      this.cogY /= this.nrItems;
    }

    public layoutItems() {
      for (let i1 = 1; i1 < this.nrItems; i1++) {
        for (let i2 = 0; i2 < this.nrItems; i2++) {
          if (i2 == i1) continue;

          this.adjustItemDistance(this.items[i1], this.items[i2]);
          if (this.repel > 0) repelItem(this.items[i1], this.items[i2], this.repel);
        }
      }
    }

    public adjustItemDistance(item1: any, item2: any) {
      const targetDistance = this.aid[item1.id][item2.id];
      if (targetDistance <= 0) return;

      const dx = item1.x - item2.x;
      const dy = item1.y - item2.y;

      let forceFactor;
      if (item2.id == 0) forceFactor = this.springForce0;
      else forceFactor = this.springForce;

      const wdx = dx / this.scaleX;
      const wdy = dy / this.scaleY;
      const distanceInWindowSpace = Math.sqrt(wdx * wdx + wdy * wdy);
      const force = (targetDistance - distanceInWindowSpace) * forceFactor;

      item1.speedX += (dx / distanceInWindowSpace) * force;
      item1.speedY += (dy / distanceInWindowSpace) * force;
    }

    layoutStep() {
      if (this.stop) return;
      this.layoutItems();
      this.recenterItems();
      this.updateItems();

      if (this.damper < this.damperMax) this.damper = this.damper * this.damperFactor;
      if (this.cycle > this.repelDelay && this.repel < this.repelMax) this.repel += this.repelIncrease;
      //if (this.cycle > this.slowdownCycle) this.frameDelay++;

      this.cycle++;
      let tempCards: any = [];
      Object.keys(elements).forEach((e, i) => {
        if (i > this.nrItems) return;
        tempCards.push(elements[e]);
      });
      setCards(tempCards);

      const thisMap = this;

      setTimeout(function () {
        thisMap.layoutStep();
      }, this.frameDelay);
    }

    public sum_of_squared_errors() {
      let error0 = 0;
      let error = 0;
      for (let i1 = 0; i1 < this.nrItems; i1++) {
        for (let i2 = i1 + 1; i2 < this.nrItems; i2++) {
          const targetDistance = this.aid[i1][i2];
          if (targetDistance <= 0) continue;

          const dx = this.items[i1].x - this.items[i2].x;
          const dy = this.items[i1].y - this.items[i2].y;

          const wdx = dx / this.scaleX;
          const wdy = dy / this.scaleY;
          const distanceInWindowSpace = Math.sqrt(wdx * wdx + wdy * wdy);
          const tmp = targetDistance - distanceInWindowSpace;
          error += tmp * tmp;
          if (i1 == 0) error0 += tmp * tmp;
        }
      }
      return { error: error, error0: error0 };
    }

    public meanTargetCenterDistance() {
      let r = 0;

      for (let i1 = 1; i1 < this.nrItems; i1++) r += this.aid[i1][0];
      r /= this.nrItems - 1;

      return r;
    }

    public search(needle: any, haystack: any) {
      let low = 0;
      let high = haystack.length - 1;

      while (low <= high) {
        const mid = parseInt('' + (low + high) / 2);
        const value = haystack[mid];

        if (value > needle) high = mid - 1;
        else if (value < needle) low = mid + 1;
        else return mid;
      }

      return -1;
    }

    public equalizeAid() {
      const values = [];

      for (let i = 0; i < this.nrItems; i++) for (let j = 0; j < this.nrItems; j++) if (this.aid[i][j] > 0) values.push(this.aid[i][j]);

      values.sort((a, b) => a - b);

      for (let i = 0; i < this.nrItems; i++)
        for (let j = 0; j < this.nrItems; j++)
          if (this.aid[i][j] > 0) {
            this.aid[i][j] = 1 - this.search(this.aid[i][j], values) / values.length;
          }
    }

    constructor() {
      this.updateBoundaries();
      let _this = this;

      this.left = 0;
      this.top = 0;
      this.aid = Aid;
      this.nrItems = 20;

      this.equalizeAid();
      this.resetItemPositions();

      setTimeout(function () {
        _this.layoutStep();
      }, 10);
    }
  }

  return mainApp;
};

export default App;
