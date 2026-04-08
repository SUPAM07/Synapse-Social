export interface CreateEventDto {
  title: string;
  description?: string;
  formatId?: string;
  themeId?: string;
  startDate: string;
  endDate: string;
  location: string;
  latitude?: number;
  longitude?: number;
  price?: number;
  capacity: number;
  picturePath?: string;
}

export interface UpdateEventDto {
  title?: string;
  description?: string;
  formatId?: string;
  themeId?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  price?: number;
  capacity?: number;
  picturePath?: string;
  isPublished?: boolean;
}

export interface CreateCommentDto {
  content: string;
}

export interface EventQueryDto {
  page?: number;
  limit?: number;
  formatId?: string;
  themeId?: string;
  search?: string;
  organizerId?: string;
}
