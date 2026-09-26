import { Inject, Injectable } from '@nestjs/common';
import {
  BRAND_REPOSITORY,
  BrandRepository,
} from '../../domain/brand-repository.port';
import {
  PHONE_REPOSITORY,
  PhoneRepository,
} from '../../domain/phone-repository.port';
import {
  buildModelKeyCandidates,
  normalizeKey,
  toTitleCase,
} from './phone-normalizer';

export interface ResolvePhoneResult {
  marca: { id: string; nombre: string };
  celular: { id: string; nombre: string; brandId: string };
  created: { marca: boolean; celular: boolean };
}

/**
 * `POST /api/inventory/phones/resolve` (ADR 0025, "Actualización
 * 2026-09-26" #2): resolves a freely-typed brand/model pair against the
 * catalog, creating whichever part does not already exist. Used both by the
 * endpoint itself and by ticket creation when `equipo.marca`/`modelo` text
 * is given without `marcaId`/`celularId`.
 */
@Injectable()
export class ResolvePhoneUseCase {
  constructor(
    @Inject(BRAND_REPOSITORY)
    private readonly brandRepository: BrandRepository,
    @Inject(PHONE_REPOSITORY)
    private readonly phoneRepository: PhoneRepository,
  ) {}

  async execute(
    marcaRaw: string,
    modeloRaw: string,
  ): Promise<ResolvePhoneResult> {
    const marcaTrimmed = marcaRaw.trim();
    const modeloTrimmed = modeloRaw.trim();

    const brandKey = normalizeKey(marcaTrimmed);
    const brands = await this.brandRepository.findAll();
    let brand = brands.find((b) => normalizeKey(b.name) === brandKey) ?? null;
    let marcaCreated = false;
    if (!brand) {
      brand = await this.brandRepository.create(toTitleCase(marcaTrimmed));
      marcaCreated = true;
    }

    const candidates = buildModelKeyCandidates(modeloTrimmed, brand.name);
    const phones = await this.phoneRepository.findAll(brand.id);
    let phone =
      phones.find((p) => candidates.includes(normalizeKey(p.name))) ?? null;
    let celularCreated = false;
    if (!phone) {
      phone = await this.phoneRepository.create(
        brand.id,
        toTitleCase(modeloTrimmed),
      );
      celularCreated = true;
    }

    return {
      marca: { id: brand.id, nombre: brand.name },
      celular: { id: phone.id, nombre: phone.name, brandId: phone.brandId },
      created: { marca: marcaCreated, celular: celularCreated },
    };
  }
}
