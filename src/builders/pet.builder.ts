import type { CategoryDto, PetDto, PetStatus, TagDto } from '@models/api/pet.dto';

export class PetBuilder {
  private pet: PetDto;

  constructor() {
    const id = Date.now();
    this.pet = {
      id,
      category: {
        id: 1,
        name: 'Default Category',
      },
      name: `playwright-pet-${id}`,
      photoUrls: [],
      tags: [],
      status: 'available',
    };
  }

  withId(id: number): PetBuilder {
    this.pet.id = id;
    return this;
  }

  withCategory(category: CategoryDto): PetBuilder {
    this.pet.category = category;
    return this;
  }

  withName(name: string): PetBuilder {
    this.pet.name = name;
    return this;
  }

  withPhotoUrls(photoUrls: string[]): PetBuilder {
    this.pet.photoUrls = [...photoUrls];
    return this;
  }

  withTags(tags: TagDto[]): PetBuilder {
    this.pet.tags = [...tags];
    return this;
  }

  withStatus(status: PetStatus): PetBuilder {
    this.pet.status = status;
    return this;
  }

  build(): PetDto {
    return {
      ...this.pet,
      category: { ...this.pet.category },
      photoUrls: [...this.pet.photoUrls],
      tags: this.pet.tags.map((tag) => ({ ...tag })),
    };
  }
}
