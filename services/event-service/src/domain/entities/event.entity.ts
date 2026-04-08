export interface EventEntity {
  id: string;
  title: string;
  description?: string | null;
  organizerId: string;
  formatId?: string | null;
  themeId?: string | null;
  startDate: Date;
  endDate: Date;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  price: number;
  capacity: number;
  picturePath?: string | null;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}
