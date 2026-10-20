import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Crosshair, Loader2, MapPin, RefreshCw, Search } from 'lucide-react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export interface AddressLocationResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  detailAddress: string;
  provinceName: string;
  districtName: string;
  wardName: string;
}

interface Props {
  latitude?: number | null;
  longitude?: number | null;
  addressQuery: string;
  onChange: (location: AddressLocationResult) => void;
  nationwide?: boolean;
  resetKey?: number;
}

const DEFAULT_POSITION: [number, number] = [10.8231, 106.6297];
const NOMINATIM_URL = import.meta.env.VITE_NOMINATIM_URL || 'https://nominatim.openstreetmap.org';
const PHOTON_URL = 'https://photon.komoot.io';

function MapTiles({ revision, onError }: { revision: number; onError: (failed: boolean) => void }) {
  const [fallback, setFallback] = useState(false);
  const loaded = useRef(false);
  useEffect(() => {
    loaded.current = false;
    onError(false);
    const timer = window.setTimeout(() => {
      if (!loaded.current) {
        if (!fallback) setFallback(true);
        else onError(true);
      }
    }, 8000);
    return () => window.clearTimeout(timer);
  }, [fallback, revision, onError]);
  return <TileLayer key={`${fallback}-${revision}`}
    url={fallback ? 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png' : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'}
    attribution={'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' + (fallback ? ' · <a href="https://www.openstreetmap.fr/">OpenStreetMap France</a>' : '')}
    maxZoom={19}
    eventHandlers={{
      loading: () => { loaded.current = false; },
      load: () => { if (fallback) onError(!loaded.current); },
      tileload: () => { loaded.current = true; onError(false); },
      tileerror: () => { if (!fallback) setFallback(true); else if (!loaded.current) onError(true); },
    }} />;
}

const markerIcon = L.divIcon({
  className: '',
  html: '<div style="width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#C59B58;border:3px solid white;box-shadow:0 4px 14px rgba(35,29,21,.32)"><div style="width:9px;height:9px;border-radius:50%;background:white;margin:9px"></div></div>',
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});

function MapInteraction({
  position,
  onPick,
  selected,
}: {
  position: [number, number];
  onPick: (latitude: number, longitude: number) => void;
  selected: boolean;
}) {
  const map = useMap();
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });

  useEffect(() => {
    if (selected) map.setView(position, Math.max(map.getZoom(), 16), { animate: true });
    const timer = window.setTimeout(() => map.invalidateSize(), 200);
    return () => window.clearTimeout(timer);
  }, [map, position[0], position[1], selected]);

  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);

  return null;
}

function toResult(payload: any, latitude: number, longitude: number): AddressLocationResult {
  const address = payload?.address || {};
  const provinceName = address.state || address.city || address.province || '';
  const districtName =
    address.city_district || address.district || address.county || address.town || '';
  const wardName =
    address.suburb || address.quarter || address.ward || address.village || address.hamlet || '';
  const detailAddress = [
    address.house_number,
    address.road || address.pedestrian,
    address.neighbourhood || address.residential,
  ].filter(Boolean).join(', ');

  return {
    latitude,
    longitude,
    formattedAddress: payload?.display_name || '',
    detailAddress,
    provinceName,
    districtName,
    wardName,
  };
}

function fromPhoton(feature: any) {
  const p = feature?.properties || {};
  return {
    lat: feature?.geometry?.coordinates?.[1], lon: feature?.geometry?.coordinates?.[0],
    display_name: [p.name, p.street, p.district, p.city, p.state, p.country].filter(Boolean).join(', '),
    address: { country_code: p.countrycode?.toLowerCase(), state: p.state || p.city, city_district: p.county,
      suburb: p.district, house_number: p.housenumber, road: p.street || (p.type === 'street' ? p.name : ''), residential: p.type !== 'street' ? p.name : '' },
  };
}

export function AddressLocationPicker({ latitude, longitude, addressQuery, onChange, nationwide = false, resetKey = 0 }: Props) {
  const [draftPosition, setDraftPosition] = useState<[number, number] | null>(
    latitude != null && longitude != null ? [Number(latitude), Number(longitude)] : null,
  );
  const [isLocating, setIsLocating] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [mapError, setMapError] = useState(false);
  const [tileRevision, setTileRevision] = useState(0);
  const lookupSequence = useRef(0);
  const lastLookupAt = useRef(0);
  const locationSequence = useRef(0);
  const locationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const position = draftPosition || (nationwide ? [16.1, 106.2] as [number, number] : DEFAULT_POSITION);
  useEffect(() => () => {
    lookupSequence.current += 1;
    locationSequence.current += 1;
    if (locationTimer.current) clearTimeout(locationTimer.current);
  }, []);

  useEffect(() => {
    setDraftPosition(
      latitude != null && longitude != null ? [Number(latitude), Number(longitude)] : null,
    );
  }, [latitude, longitude]);

  useEffect(() => {
    lookupSequence.current += 1;
    locationSequence.current += 1;
    if (locationTimer.current) clearTimeout(locationTimer.current);
    setIsLocating(false);
    setIsResolving(false);
    setMessage(null);
    setDraftPosition(latitude != null && longitude != null ? [Number(latitude), Number(longitude)] : null);
    // Explicit parent reset also cancels pending lookups when coordinates were already empty.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const requestJson = useCallback(async (url: URL, sequence: number) => {
    const waitMs = Math.max(0, 1100 - (Date.now() - lastLookupAt.current));
    if (waitMs) await new Promise((resolve) => window.setTimeout(resolve, waitMs));
    if (sequence !== lookupSequence.current) return null;
    lastLookupAt.current = Date.now();
    const response = await fetch(url, {
      headers: { Accept: 'application/json', 'Accept-Language': 'vi' },
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) throw new Error('Dịch vụ bản đồ đang bận, vui lòng thử lại');
    return response.json();
  }, []);

  const reverseGeocode = useCallback(async (nextLatitude: number, nextLongitude: number) => {
    setDraftPosition([nextLatitude, nextLongitude]);
    setIsResolving(true);
    setMessage(null);
    const sequence = ++lookupSequence.current;
    try {
      const url = new URL('/reverse', NOMINATIM_URL);
      url.searchParams.set('format', 'jsonv2');
      url.searchParams.set('addressdetails', '1');
      url.searchParams.set('accept-language', 'vi');
      url.searchParams.set('lat', String(nextLatitude));
      url.searchParams.set('lon', String(nextLongitude));
      let payload;
      try { payload = await requestJson(url, sequence); }
      catch {
        if (sequence !== lookupSequence.current) return;
        const fallback = new URL('/reverse', PHOTON_URL);
        fallback.searchParams.set('lat', String(nextLatitude));
        fallback.searchParams.set('lon', String(nextLongitude));
        const result = await requestJson(fallback, sequence);
        payload = result?.features?.[0] ? fromPhoton(result.features[0]) : null;
        if (!payload && sequence === lookupSequence.current) throw new Error('Đã đặt ghim nhưng chưa tra được địa chỉ. Vui lòng nhập số nhà, tên đường ở trên.');
      }
      if (!payload || sequence !== lookupSequence.current) return;
      if (payload.address?.country_code !== 'vn') throw new Error('Vui lòng chọn vị trí giao hàng tại Việt Nam.');
      onChange(toResult(payload, nextLatitude, nextLongitude));
      setMessage('Đã xác định địa chỉ. Vui lòng kiểm tra lại các trường bên trên.');
    } catch (error: any) {
      if (sequence === lookupSequence.current) {
        setMessage(error instanceof TypeError || error?.name === 'TimeoutError' ? 'Đã đặt ghim nhưng không kết nối được dịch vụ địa chỉ. Vui lòng nhập địa chỉ chi tiết ở trên hoặc thử lại.' : error?.message || 'Không thể xác định địa chỉ tại vị trí này');
      }
    } finally {
      if (sequence === lookupSequence.current) setIsResolving(false);
    }
  }, [onChange, requestJson]);

  const locateMe = () => {
    if (!navigator.geolocation) {
      setMessage('Trình duyệt này không hỗ trợ định vị GPS.');
      return;
    }
    setIsLocating(true);
    setMessage('Đang xin vị trí thiết bị. Hãy chọn Cho phép nếu trình duyệt hỏi quyền vị trí.');
    const sequence = ++locationSequence.current;
    locationTimer.current = setTimeout(() => {
      if (sequence !== locationSequence.current) return;
      locationSequence.current += 1;
      setIsLocating(false);
      setMessage('Chưa nhận được vị trí. Hãy cho phép vị trí cho trang này và bật Dịch vụ định vị của thiết bị, rồi thử lại.');
    }, 14000);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (sequence !== locationSequence.current) return;
        if (locationTimer.current) clearTimeout(locationTimer.current);
        setIsLocating(false);
        void reverseGeocode(coords.latitude, coords.longitude);
      },
      (error) => {
        if (sequence !== locationSequence.current) return;
        if (locationTimer.current) clearTimeout(locationTimer.current);
        setIsLocating(false);
        setMessage(
          error.code === error.PERMISSION_DENIED
            ? 'Bạn chưa cho phép truy cập vị trí. Hãy bật quyền định vị trong trình duyệt.'
            : error.code === error.TIMEOUT
              ? 'Lấy vị trí quá lâu. Hãy bật Dịch vụ định vị của thiết bị rồi thử lại, hoặc chọn trực tiếp trên bản đồ.'
              : 'Thiết bị chưa cung cấp được vị trí. Hãy bật Dịch vụ định vị hoặc chọn trực tiếp trên bản đồ.',
        );
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 },
    );
  };

  const searchAddress = async () => {
    if (!addressQuery.trim()) {
      setMessage('Hãy nhập địa chỉ chi tiết trước khi tìm trên bản đồ.');
      return;
    }
    setIsResolving(true);
    setMessage(null);
    const sequence = ++lookupSequence.current;
    try {
      const url = new URL('/search', NOMINATIM_URL);
      url.searchParams.set('format', 'jsonv2');
      url.searchParams.set('addressdetails', '1');
      url.searchParams.set('accept-language', 'vi');
      url.searchParams.set('countrycodes', 'vn');
      url.searchParams.set('limit', '1');
      url.searchParams.set('q', addressQuery.trim());
      let payload;
      try { payload = await requestJson(url, sequence); }
      catch {
        if (sequence !== lookupSequence.current) return;
        const fallback = new URL('/api/', PHOTON_URL);
        fallback.searchParams.set('q', addressQuery.trim());
        fallback.searchParams.set('limit', '5');
        const result = await requestJson(fallback, sequence);
        payload = (result?.features || []).map(fromPhoton).filter((match: any) => match.address.country_code === 'vn');
      }
      if (sequence !== lookupSequence.current) return;
      const match = payload?.[0];
      if (!match) throw new Error('Không tìm thấy địa chỉ. Hãy thêm số nhà hoặc tên đường.');
      if (match.address?.country_code !== 'vn') throw new Error('Vui lòng chọn vị trí giao hàng tại Việt Nam.');
      const nextLatitude = Number(match.lat);
      const nextLongitude = Number(match.lon);
      if (!Number.isFinite(nextLatitude) || !Number.isFinite(nextLongitude)) throw new Error('Chưa xác định được tọa độ địa chỉ. Vui lòng thử lại.');
      setDraftPosition([nextLatitude, nextLongitude]);
      onChange(toResult(match, nextLatitude, nextLongitude));
      setMessage('Đã đặt ghim theo địa chỉ bạn nhập.');
    } catch (error: any) {
      if (sequence === lookupSequence.current) setMessage(error?.message || 'Không thể tìm địa chỉ');
    } finally {
      if (sequence === lookupSequence.current) setIsResolving(false);
    }
  };

  const coordinateLabel = useMemo(
    () => draftPosition ? `${draftPosition[0].toFixed(6)}, ${draftPosition[1].toFixed(6)}` : 'Chưa ghim vị trí',
    [draftPosition],
  );

  return (
    <section className="address-location-picker shrink-0 overflow-hidden rounded-2xl border border-[#EEDFC6] bg-[#FBF5EB]">
      <div className="address-location-header p-3.5 sm:p-4">
        <div className="address-location-toolbar flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <strong className="flex items-center gap-2 text-xs font-black text-[#1A1612]">
              <MapPin className="w-4 h-4 text-[#B88E4F]" /> Vị trí giao hàng
            </strong>
            <span className="block mt-1 text-[11px] text-[#7D715E]">
              Bấm bản đồ hoặc kéo ghim để chọn vị trí.
            </span>
          </div>
          <div className="address-location-actions flex gap-2 shrink-0">
            <button type="button" onClick={searchAddress} disabled={isLocating || isResolving} className="rounded-xl border border-[#EEDFC6] bg-white px-3 py-2 text-[11px] font-bold text-[#B88E4F] hover:bg-[#F3EFE6] disabled:opacity-50 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" /> Tìm địa chỉ
            </button>
            <button type="button" onClick={locateMe} disabled={isLocating || isResolving} className="address-location-locate rounded-xl bg-[#C59B58] px-3 py-2 text-[11px] font-bold text-white hover:bg-[#B88E4F] disabled:opacity-50 flex items-center gap-1.5">
              {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crosshair className="w-3.5 h-3.5" />}
              Vị trí của tôi
            </button>
          </div>
        </div>
        {message && <p role="status" aria-live="polite" className="mt-3 text-xs leading-relaxed text-[#7D715E]">{message}</p>}
        {mapError && <div role="alert" className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#7D715E]"><AlertCircle size={15} />Chưa tải được nền bản đồ. Kiểm tra kết nối rồi thử lại.<button type="button" onClick={() => { setMapError(false); setTileRevision(value => value + 1); }} className="flex items-center gap-1 font-semibold text-[#B88E4F]"><RefreshCw size={13} />Tải lại bản đồ</button></div>}
      </div>

      <div className="address-location-map relative h-56 border-y border-[#EEDFC6] bg-[#F3EFE6]">
        <MapContainer center={position} zoom={draftPosition ? 16 : nationwide ? 5 : 11} scrollWheelZoom={false} className="h-full w-full" style={{ minHeight: 224, height: '100%', width: '100%', zIndex: 0 }} attributionControl>
          <MapTiles key={tileRevision} revision={tileRevision} onError={setMapError} />
          <MapInteraction position={position} onPick={reverseGeocode} selected={Boolean(draftPosition)} />
          {draftPosition && (
            <Marker
              position={draftPosition}
              icon={markerIcon}
              draggable
              eventHandlers={{
                dragend(event) {
                  const next = event.target.getLatLng();
                  reverseGeocode(next.lat, next.lng);
                },
              }}
            />
          )}
        </MapContainer>
        {(isLocating || isResolving) && (
          <div className="absolute inset-0 z-[500] grid place-items-center bg-white/55 backdrop-blur-[1px] pointer-events-none">
            <div className="rounded-full bg-white px-3 py-2 shadow-lg text-[11px] font-bold text-[#B88E4F] flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> {isLocating ? 'Đang lấy vị trí thiết bị…' : 'Đang tra cứu địa chỉ…'}
            </div>
          </div>
        )}
      </div>

      <div className="address-location-status flex items-start justify-between gap-3 px-4 py-3 text-[10px]">
        <span className="text-[#7D715E]">
          Dữ liệu địa chỉ OpenStreetMap. Kiểm tra địa chỉ trước khi lưu.
        </span>
        <span className="font-mono text-[#7D715E] shrink-0">{coordinateLabel}</span>
      </div>
    </section>
  );
}
