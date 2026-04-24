export interface ApiMessageDto {
  code: number;
  type: string;
  message: string;
}

export type InventoryDto = Record<string, number>;

export interface UploadImageResponseDto {
  code: number;
  type: string;
  message: string;
}
