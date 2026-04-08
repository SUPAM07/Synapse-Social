export interface UpdateUserDto {
  fullName?: string;
  picturePath?: string;
}

export interface CreateCompanyDto {
  name: string;
  description?: string;
  picturePath?: string;
}

export interface UpdateCompanyDto {
  name?: string;
  description?: string;
  picturePath?: string;
}
