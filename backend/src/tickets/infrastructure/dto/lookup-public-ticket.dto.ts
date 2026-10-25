import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * Body of `POST /api/tickets/public/lookup` (2026-10-25 hardening, C5).
 *
 * Before this DTO the route accepted `unknown`: a non-string `codigo` (or
 * `telefono`) reached the use case and surfaced as a 500. Validation belongs
 * here, at the HTTP boundary; `TicketUseCases.lookupPublicTicket` still owns
 * the functional rule (both values required, phone normalized to digits).
 */
export class LookupPublicTicketDto {
  @IsString({ message: 'El número de ticket debe ser texto' })
  @IsNotEmpty({ message: 'Ingresa el número de ticket' })
  @MaxLength(40, {
    message: 'El número de ticket no debe tener más de 40 caracteres',
  })
  codigo!: string;

  @IsString({ message: 'El celular debe ser texto' })
  @IsNotEmpty({ message: 'Ingresa el celular registrado' })
  @MaxLength(40, {
    message: 'El celular no debe tener más de 40 caracteres',
  })
  telefono!: string;
}
