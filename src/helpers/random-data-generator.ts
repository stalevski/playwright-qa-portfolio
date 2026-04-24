import type { LocalCustomerDto, LocalEmployeeDto, LocalOrderDto, LocalPetDto, LocalUserDto } from '@models/api/local.dto';
import type { OrderDto } from '@models/api/order.dto';
import type { PetDto, PetStatus } from '@models/api/pet.dto';
import type { UserDto } from '@models/api/user.dto';

export class RandomDataGenerator {
  private static readonly alphabetLower = 'abcdefghijklmnopqrstuvwxyz';
  private static readonly alphabetUpper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  private static readonly digits = '0123456789';
  private static readonly symbols = '!@#$%^&*_-+=';
  private static readonly loremWords = [
    'alpha', 'beta', 'gamma', 'delta', 'omega', 'pixel', 'cloud', 'forest', 'river', 'stone',
    'shadow', 'ember', 'nova', 'signal', 'vector', 'harbor', 'summit', 'orchid', 'cobalt', 'silver',
  ];
  private static readonly dogNames = ['Buddy', 'Max', 'Charlie', 'Rocky', 'Cooper', 'Milo', 'Teddy', 'Leo'];
  private static readonly catNames = ['Luna', 'Bella', 'Simba', 'Nala', 'Mochi', 'Misty', 'Cleo', 'Willow'];
  private static readonly birdNames = ['Sunny', 'Kiwi', 'Pico', 'Skye', 'Rio', 'Blue', 'Piper', 'Echo'];
  private static readonly petCategories = ['Dogs', 'Cats', 'Birds'];
  private static readonly petNotes = [
    'Friendly with children and leash trained',
    'Vaccinated and ready for adoption',
    'Energetic temperament with basic obedience training',
    'Indoor pet with recent health check completed',
    'Calm personality and good with other pets',
    'Comes with starter kit and feeding schedule',
  ];
  private static readonly firstNames = ['Alex', 'Mia', 'Daniel', 'Sofia', 'Liam', 'Emma', 'Noah', 'Olivia'];
  private static readonly lastNames = ['Parker', 'Stone', 'Carter', 'Bennett', 'Hayes', 'Coleman', 'Reed', 'Brooks'];
  private static readonly streetNames = ['Oak Street', 'Maple Avenue', 'River Road', 'Sunset Lane', 'Hillcrest Drive', 'Pine Court'];
  private static readonly cities = ['Skopje', 'Belgrade', 'Sofia', 'Vienna', 'Prague', 'Warsaw', 'Berlin', 'Amsterdam'];
  private static readonly countries = ['North Macedonia', 'Serbia', 'Bulgaria', 'Austria', 'Czech Republic', 'Poland', 'Germany', 'Netherlands'];
  private static readonly companyPrefixes = ['Pet', 'Nova', 'Blue', 'Cloud', 'Prime', 'Silver', 'Peak', 'Smart'];
  private static readonly companySuffixes = ['Labs', 'Systems', 'Solutions', 'Works', 'Studios', 'Group', 'Hub', 'Dynamics'];
  private static readonly roles = ['customer', 'manager', 'admin'];
  private static readonly employeeStatuses: LocalEmployeeDto['status'][] = ['active', 'leave', 'inactive'];
  private static readonly customerStatuses: LocalCustomerDto['status'][] = ['active', 'prospect', 'inactive'];
  private static readonly customerSegments: LocalCustomerDto['segment'][] = ['retail', 'vip', 'breeder', 'rescue'];
  private static readonly loyaltyTiers: LocalCustomerDto['loyaltyTier'][] = ['bronze', 'silver', 'gold', 'platinum'];
  private static readonly departments = ['Operations', 'Veterinary', 'Support', 'Finance', 'Marketing'];
  private static readonly jobTitles = ['Coordinator', 'Manager', 'Specialist', 'Supervisor', 'Associate'];
  private static readonly locations = ['HQ', 'Storefront', 'Warehouse', 'Remote'];
  private static readonly orderStatuses: LocalOrderDto['status'][] = ['placed', 'approved', 'completed', 'cancelled'];
  private static readonly petStatuses: PetStatus[] = ['available', 'pending', 'sold'];
  private static readonly usernamePrefixes = ['petlover', 'qauser', 'sandbox', 'shopper', 'adopter', 'caretaker'];
  private static readonly noteSuffixes = ['for regression checks', 'for smoke coverage', 'for audit verification', 'for relation testing'];

  static randomNumber(min = 0, max = 9999): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static randomId(min = 10000, max = 99999): number {
    return this.randomNumber(min, max);
  }

  static randomDecimal(min = 0, max = 1000, fractionDigits = 2): number {
    const value = Math.random() * (max - min) + min;
    return Number(value.toFixed(fractionDigits));
  }

  static randomBoolean(trueProbability = 0.5): boolean {
    return Math.random() < trueProbability;
  }

  static pickOne<T>(values: readonly T[]): T {
    return values[Math.floor(Math.random() * values.length)];
  }

  static pickManyUnique<T>(values: readonly T[], count: number): T[] {
    const uniqueValues = [...values];
    const result: T[] = [];
    const maxItems = Math.min(Math.max(count, 0), uniqueValues.length);

    while (result.length < maxItems) {
      const index = this.randomNumber(0, uniqueValues.length - 1);
      const [value] = uniqueValues.splice(index, 1);
      result.push(value);
    }

    return result;
  }

  static repeat<T>(factory: (index: number) => T, count: number): T[] {
    return Array.from({ length: count }, (_value, index) => factory(index));
  }

  static shuffle<T>(values: readonly T[]): T[] {
    const copy = [...values];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const randomIndex = this.randomNumber(0, index);
      [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
    }
    return copy;
  }

  static randomChar(charset = `${this.alphabetLower}${this.alphabetUpper}${this.digits}`): string {
    return charset[this.randomNumber(0, charset.length - 1)];
  }

  static randomString(length = 12, charset = `${this.alphabetLower}${this.alphabetUpper}${this.digits}`): string {
    return Array.from({ length }, () => this.randomChar(charset)).join('');
  }

  static randomAlphaString(length = 12): string {
    return this.randomString(length, `${this.alphabetLower}${this.alphabetUpper}`);
  }

  static randomLowercaseString(length = 12): string {
    return this.randomString(length, this.alphabetLower);
  }

  static randomUppercaseString(length = 12): string {
    return this.randomString(length, this.alphabetUpper);
  }

  static randomNumericString(length = 10): string {
    return this.randomString(length, this.digits);
  }

  static randomAlphaNumeric(length = 12): string {
    return this.randomString(length, `${this.alphabetLower}${this.alphabetUpper}${this.digits}`);
  }

  static randomPassword(length = 14): string {
    const safeLength = Math.max(length, 4);
    const base = [
      this.randomChar(this.alphabetLower),
      this.randomChar(this.alphabetUpper),
      this.randomChar(this.digits),
      this.randomChar(this.symbols),
      ...Array.from({ length: safeLength - 4 }, () => this.randomChar(`${this.alphabetLower}${this.alphabetUpper}${this.digits}${this.symbols}`)),
    ];
    return this.shuffle(base).join('');
  }

  static randomHex(length = 8): string {
    return this.randomString(length, `${this.digits}abcdef`);
  }

  static randomUuidLike(): string {
    return `${this.randomHex(8)}-${this.randomHex(4)}-${this.randomHex(4)}-${this.randomHex(4)}-${this.randomHex(12)}`;
  }

  static randomWord(): string {
    return this.pickOne(this.loremWords);
  }

  static randomWords(count = 3): string[] {
    return this.repeat(() => this.randomWord(), count);
  }

  static randomSentence(wordCount = 8): string {
    const words = this.randomWords(wordCount);
    const firstWord = words[0].charAt(0).toUpperCase() + words[0].slice(1);
    return `${[firstWord, ...words.slice(1)].join(' ')}.`;
  }

  static randomParagraph(sentenceCount = 3): string {
    return this.repeat(() => this.randomSentence(this.randomNumber(6, 12)), sentenceCount).join(' ');
  }

  static randomSlug(wordCount = 3): string {
    return this.randomWords(wordCount).join('-').toLowerCase();
  }

  static randomDateBetween(start: Date, end: Date): Date {
    const timestamp = this.randomNumber(start.getTime(), end.getTime());
    return new Date(timestamp);
  }

  static randomPastDate(daysBack = 30): Date {
    const end = new Date();
    const start = new Date(end.getTime() - daysBack * 24 * 60 * 60 * 1000);
    return this.randomDateBetween(start, end);
  }

  static randomFutureDate(daysForward = 30): Date {
    const start = new Date();
    const end = new Date(start.getTime() + daysForward * 24 * 60 * 60 * 1000);
    return this.randomDateBetween(start, end);
  }

  static randomIsoDatePast(daysBack = 30): string {
    return this.randomPastDate(daysBack).toISOString();
  }

  static randomIsoDateFuture(daysForward = 30): string {
    return this.randomFutureDate(daysForward).toISOString();
  }

  static randomTimeString(): string {
    const hours = String(this.randomNumber(0, 23)).padStart(2, '0');
    const minutes = String(this.randomNumber(0, 59)).padStart(2, '0');
    const seconds = String(this.randomNumber(0, 59)).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  static randomPetStatus(): PetStatus {
    return this.pickOne(this.petStatuses);
  }

  static randomOrderStatus(): LocalOrderDto['status'] {
    return this.pickOne(this.orderStatuses);
  }

  static randomPetCategory(): string {
    return this.pickOne(this.petCategories);
  }

  static randomPetName(category?: string): string {
    const resolvedCategory = category ?? this.randomPetCategory();
    const namePool = resolvedCategory === 'Dogs'
      ? this.dogNames
      : resolvedCategory === 'Cats'
        ? this.catNames
        : this.birdNames;

    return `${this.pickOne(namePool)} ${this.randomId(1, 999)}`;
  }

  static randomPetNote(): string {
    return `${this.pickOne(this.petNotes)} ${this.pickOne(this.noteSuffixes)}`;
  }

  static randomName(): string {
    return `${this.randomFirstName()} ${this.randomLastName()}`;
  }

  static randomFirstName(): string {
    return this.pickOne(this.firstNames);
  }

  static randomLastName(): string {
    return this.pickOne(this.lastNames);
  }

  static randomUsername(): string {
    return `${this.pickOne(this.usernamePrefixes)}-${this.randomId(1000, 9999)}`;
  }

  static randomEmail(username?: string, domain = 'pethub.test'): string {
    const resolvedUsername = username ?? this.randomUsername();
    return `${resolvedUsername}@${domain}`;
  }

  static randomPhoneNumber(countryCode = '+389'): string {
    return `${countryCode}${this.randomNumericString(8)}`;
  }

  static randomPostalCode(length = 4): string {
    return this.randomNumericString(length);
  }

  static randomStreetAddress(): string {
    return `${this.randomNumber(1, 999)} ${this.pickOne(this.streetNames)}`;
  }

  static randomCity(): string {
    return this.pickOne(this.cities);
  }

  static randomCountry(): string {
    return this.pickOne(this.countries);
  }

  static randomAddress(): { street: string; city: string; postalCode: string; country: string } {
    return {
      street: this.randomStreetAddress(),
      city: this.randomCity(),
      postalCode: this.randomPostalCode(),
      country: this.randomCountry(),
    };
  }

  static randomCompanyName(): string {
    return `${this.pickOne(this.companyPrefixes)} ${this.pickOne(this.companySuffixes)}`;
  }

  static randomUrl(host = 'example.test', pathSegments: string[] = [this.randomSlug(2)]): string {
    const normalizedPath = pathSegments.join('/');
    return `https://${host}/${normalizedPath}`;
  }

  static randomFileName(extension = 'txt'): string {
    return `${this.randomSlug(2)}-${this.randomId(1, 9999)}.${extension}`;
  }

  static randomMimeType(): string {
    return this.pickOne(['text/plain', 'application/json', 'image/png', 'image/jpeg', 'application/pdf']);
  }

  static randomColorHex(): string {
    return `#${this.randomHex(6)}`;
  }

  static randomEnumValue<T>(values: readonly T[]): T {
    return this.pickOne(values);
  }

  static randomRole(): string {
    return this.pickOne(this.roles);
  }

  static randomEmployeeStatus(): LocalEmployeeDto['status'] {
    return this.pickOne(this.employeeStatuses);
  }

  static randomCustomerStatus(): LocalCustomerDto['status'] {
    return this.pickOne(this.customerStatuses);
  }

  static createLocalPet(overrides: Partial<Omit<LocalPetDto, 'createdAt' | 'updatedAt'>> = {}): Omit<LocalPetDto, 'createdAt' | 'updatedAt'> {
    const category = overrides.category ?? this.randomPetCategory();
    return {
      id: overrides.id ?? this.randomId(90000, 99999),
      name: overrides.name ?? this.randomPetName(category),
      category,
      status: overrides.status ?? this.randomPetStatus(),
      price: overrides.price ?? this.randomDecimal(150, 2500),
      notes: overrides.notes ?? this.randomPetNote(),
    };
  }

  static createLocalUser(overrides: Partial<Omit<LocalUserDto, 'createdAt'>> = {}): Omit<LocalUserDto, 'createdAt'> {
    const username = overrides.username ?? this.randomUsername();
    return {
      id: overrides.id ?? this.randomId(90000, 99999),
      username,
      firstName: overrides.firstName ?? this.randomFirstName(),
      lastName: overrides.lastName ?? this.randomLastName(),
      email: overrides.email ?? this.randomEmail(username),
      role: overrides.role ?? this.randomRole(),
      password: overrides.password ?? this.randomPassword(),
      phone: overrides.phone ?? this.randomPhoneNumber(),
      userStatus: overrides.userStatus ?? 1,
    };
  }

  static createLocalOrder(overrides: Partial<Omit<LocalOrderDto, 'createdAt' | 'updatedAt'>> = {}): Omit<LocalOrderDto, 'createdAt' | 'updatedAt'> {
    return {
      id: overrides.id ?? this.randomId(90000, 99999),
      petId: overrides.petId ?? this.randomId(90000, 99999),
      userId: overrides.userId ?? this.randomId(90000, 99999),
      quantity: overrides.quantity ?? this.randomId(1, 3),
      status: overrides.status ?? this.randomOrderStatus(),
      totalAmount: overrides.totalAmount ?? this.randomDecimal(100, 3000),
    };
  }

  static createLocalEmployee(overrides: Partial<Omit<LocalEmployeeDto, 'createdAt'>> = {}): Omit<LocalEmployeeDto, 'createdAt'> {
    return {
      id: overrides.id ?? this.randomId(40000, 49999),
      userId: overrides.userId ?? this.randomId(90000, 99999),
      employeeCode: overrides.employeeCode ?? `EMP-${this.randomId(1000, 9999)}`,
      department: overrides.department ?? this.pickOne(this.departments),
      title: overrides.title ?? this.pickOne(this.jobTitles),
      location: overrides.location ?? this.pickOne(this.locations),
      status: overrides.status ?? this.randomEmployeeStatus(),
      hireDate: overrides.hireDate ?? this.randomIsoDatePast(365),
    };
  }

  static createLocalCustomer(overrides: Partial<Omit<LocalCustomerDto, 'createdAt'>> = {}): Omit<LocalCustomerDto, 'createdAt'> {
    return {
      id: overrides.id ?? this.randomId(50000, 59999),
      userId: overrides.userId ?? this.randomId(90000, 99999),
      customerNumber: overrides.customerNumber ?? `CUST-${this.randomId(1000, 9999)}`,
      segment: overrides.segment ?? this.pickOne(this.customerSegments),
      loyaltyTier: overrides.loyaltyTier ?? this.pickOne(this.loyaltyTiers),
      status: overrides.status ?? this.randomCustomerStatus(),
      lifetimeValue: overrides.lifetimeValue ?? this.randomDecimal(250, 5000),
    };
  }

  static createPublicPet(overrides: Partial<PetDto> = {}): PetDto {
    const categoryName = overrides.category?.name ?? this.randomPetCategory();
    const status = overrides.status ?? this.randomPetStatus();
    return {
      id: overrides.id ?? this.randomId(),
      category: overrides.category ?? { id: this.randomId(1, 999), name: categoryName },
      name: overrides.name ?? this.randomPetName(categoryName),
      photoUrls: overrides.photoUrls ?? [this.randomUrl('example.test', ['pets', `${this.randomId(1, 9999)}.jpg`])],
      tags: overrides.tags ?? [{ id: this.randomId(1, 999), name: categoryName.toLowerCase() }],
      status,
    };
  }

  static createPublicUser(overrides: Partial<UserDto> = {}): UserDto {
    const username = overrides.username ?? this.randomUsername();
    return {
      id: overrides.id ?? this.randomId(),
      username,
      firstName: overrides.firstName ?? this.randomFirstName(),
      lastName: overrides.lastName ?? this.randomLastName(),
      email: overrides.email ?? this.randomEmail(username),
      password: overrides.password ?? this.randomPassword(),
      phone: overrides.phone ?? this.randomPhoneNumber(),
      userStatus: overrides.userStatus ?? 1,
    };
  }

  static createPublicOrder(overrides: Partial<OrderDto> = {}): OrderDto {
    return {
      id: overrides.id ?? this.randomId(),
      petId: overrides.petId ?? this.randomId(),
      quantity: overrides.quantity ?? this.randomId(1, 5),
      shipDate: overrides.shipDate ?? this.randomIsoDateFuture(14),
      status: overrides.status ?? 'placed',
      complete: overrides.complete ?? false,
    };
  }
}
