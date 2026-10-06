import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Crosshair, Loader2, MapPin, Search } from 'lucide-react';
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
}

const DEFAULT_POSITION: [number, number] = [10.8231, 106.6297];
const NOMINATIM_URL = import.meta.env.VITE_NOMINATIM_URL || 'https://nominatim.openstreetmap.org';

const markerIcon = L.divIcon({
  className: '',
  html: '<div style="width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#C59B58;border:3px solid white;box-shadow:0 4px 14px rgba(35,29,21,.32)"><div style="width:9px;height:9px;border-radius:50%;background:white;margin:9px"></div></div>',
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});

function MapInteraction({
  position,
  onPick,
}: {
  position: [number, number];
  onPick: (latitude: number, longitude: number) => void;
}) {
  const map = useMap();
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });

  useEffect(() => {
    map.setView(position, Math.max(map.getZoom(), 16), { animate: true });
  }, [map, position[0], position[1]]);

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

export function AddressLocationPicker({ latitude, longitude, addressQuery, onChange }: Props) {
  const [draftPosition, setDraftPosition] = useState<[number, number] | null>(
    latitude != null && longitude != null ? [Number(latitude), Number(longitude)] : null,
  );
  const [isLocating, setIsLocating] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const lookupSequence = useRef(0);
  const lastLookupAt = useRef(0);
  const position = draftPosition || DEFAULT_POSITION;

  useEffect(() => {
    setDraftPosition(
      latitude != null && longitude != null ? [Number(latitude), Number(longitude)] : null,
    );
  }, [latitude, longitude]);

  const requestJson = useCallback(async (url: URL, sequence: number) => {
    const waitMs = Math.max(0, 1100 - (Date.now() - lastLookupAt.current));
    if (waitMs) await new Promise((resolve) => window.setTimeout(resolve, waitMs));
    if (sequence !== lookupSequence.current) return null;
    lastLookupAt.current = Date.now();
    const response = await fetch(url, {
      headers: { Accept: 'application/json', 'Accept-Language': 'vi' },
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
      const payload = await requestJson(url, sequence);
      if (!payload) return;
      onChange(toResult(payload, nextLatitude, nextLongitude));
      setMessage('Đã xác định địa chỉ. Vui lòng kiểm tra lại các trường bên trên.');
    } catch (error: any) {
      if (sequence === lookupSequence.current) {
        setMessage(error?.message || 'Không thể xác định địa chỉ tại vị trí này');
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
    setMessage(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setIsLocating(false);
        reverseGeocode(coords.latitude, coords.longitude);
      },
      (error) => {
        setIsLocating(false);
        setMessage(
          error.code === error.PERMISSION_DENIED
            ? 'Bạn chưa cho phép truy cập vị trí. Hãy bật quyền định vị trong trình duyệt.'
            : 'Không lấy được vị trí hiện tại. Bạn có thể bấm trực tiếp trên bản đồ.',
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
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
      const payload = await requestJson(url, sequence);
      const match = payload?.[0];
      if (!match) throw new Error('Không tìm thấy địa chỉ. Hãy thêm số nhà hoặc tên đường.');
      const nextLatitude = Number(match.lat);
      const nextLongitude = Number(match.lon);
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
    <section className="overflow-hidden rounded-2xl border border-[#EEDFC6] bg-[#FBF5EB]">
      <div className="p-3.5 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <strong className="flex items-center gap-2 text-xs font-black text-[#1A1612]">
              <MapPin className="w-4 h-4 text-[#B88E4F]" /> Ghim vị trí giao hàng chính xác
            </strong>
            <span className="block mt-1 text-[11px] text-[#7D715E]">
              Bấm lên bản đồ hoặc kéo ghim để điều chỉnh vị trí.
            </span>
          </div>
          <div className="flex gap-2 shrink-0">
            <button type="button" onClick={searchAddress} disabled={isResolving} className="rounded-xl border border-[#EEDFC6] bg-white px-3 py-2 text-[11px] font-bold text-[#B88E4F] hover:bg-[#F3EFE6] disabled:opacity-50 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" /> Tìm địa chỉ
            </button>
            <button type="button" onClick={locateMe} disabled={isLocating || isResolving} className="rounded-xl bg-[#C59B58] px-3 py-2 text-[11px] font-bold text-white hover:bg-[#B88E4F] disabled:opacity-50 flex items-center gap-1.5">
              {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crosshair className="w-3.5 h-3.5" />}
              Vị trí của tôi
            </button>
          </div>
        </div>
      </div>

      <div className="relative h-56 border-y border-[#EEDFC6] bg-[#F3EFE6]">
        <MapContainer center={position} zoom={draftPosition ? 16 : 11} scrollWheelZoom className="h-full w-full" attributionControl>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapInteraction position={position} onPick={reverseGeocode} />
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
              <Loader2 className="w-4 h-4 animate-spin" /> Đang xác định địa chỉ...
            </div>
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-3 px-4 py-3 text-[10px]">
        <span className={message?.startsWith('Đã') ? 'text-[#B88E4F] font-semibold' : 'text-[#7D715E]'}>
          {message || 'Thông tin bản đồ được cung cấp bởi OpenStreetMap.'}
        </span>
        <span className="font-mono text-[#7D715E] shrink-0">{coordinateLabel}</span>
      </div>
    </section>
  );
}
