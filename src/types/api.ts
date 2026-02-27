import type { components, operations } from './api.generated';

export type CreateUserDto = components['schemas']['CreateUserDto'];
export type LoginDto = components['schemas']['LoginDto'];
export type UserResponseDto = components['schemas']['UserResponseDto'];
export type AuthResponseDto = components['schemas']['AuthResponseDto'];
export type AccountResponseDto = components['schemas']['AccountResponseDto'];
export type ShipmentResponseDto = components['schemas']['ShipmentResponseDto'];
export type SyncJobResponseDto = components['schemas']['SyncJobResponseDto'];
export type HealthResponseDto = components['schemas']['HealthResponseDto'];

export type AuthLoginRequest =
  operations['AuthController_login']['requestBody']['content']['application/json'];
export type AuthLoginResponse =
  operations['AuthController_login']['responses'][200]['content']['application/json'];
