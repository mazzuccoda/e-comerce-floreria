export interface AddressData {
  formatted_address: string;
  street: string;
  number: string;
  city: string;
  state: string;
  postal_code: string;
  lat: number;
  lng: number;
  place_id?: string;
}

export interface DeliveryZoneValidation {
  delivers_here: boolean;
  zone_name?: string;
  delivery_cost?: number;
  estimated_time?: string;
  free_shipping_from?: number;
  message?: string;
}

export interface MapCenter {
  lat: number;
  lng: number;
}
