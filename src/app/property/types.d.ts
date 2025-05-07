
interface Availability {
  Sunday: null | TimeRange;
  Monday: null | TimeRange;
  Tuesday: null | TimeRange;
  Wednesday: null | TimeRange;
  Thursday: null | TimeRange;
  Friday: null | TimeRange;
  Saturday: null | TimeRange;
}

interface TimeRange {
  from: string; // ISO date string
  to: string; // ISO date string
}

export interface PropertyFormData {
  type: string;
  listingType: string;
  bathrooms: number;
  bedrooms: number;
  bed: number;
  title: string;
  description: string;
  price: string;
  currency: string;
  lat: number;
  lon: number;
  city: string;
  address: string;
  amenities: string[];
  availability: Availability;
}