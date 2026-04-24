import type { UserDto } from '@models/api/user.dto';
import { uniqueId } from '@helpers/unique-id';

export class UserBuilder {
  private user: UserDto;

  constructor() {
    const id = uniqueId();
    this.user = {
      id,
      username: `playwright-user-${id}`,
      firstName: 'Playwright',
      lastName: 'User',
      email: `playwright-${id}@example.com`,
      password: 'Password123!',
      phone: '1234567890',
      userStatus: 1,
    };
  }

  withId(id: number): UserBuilder {
    this.user.id = id;
    return this;
  }

  withUsername(username: string): UserBuilder {
    this.user.username = username;
    return this;
  }

  withFirstName(firstName: string): UserBuilder {
    this.user.firstName = firstName;
    return this;
  }

  withLastName(lastName: string): UserBuilder {
    this.user.lastName = lastName;
    return this;
  }

  withEmail(email: string): UserBuilder {
    this.user.email = email;
    return this;
  }

  withPassword(password: string): UserBuilder {
    this.user.password = password;
    return this;
  }

  withPhone(phone: string): UserBuilder {
    this.user.phone = phone;
    return this;
  }

  withUserStatus(userStatus: number): UserBuilder {
    this.user.userStatus = userStatus;
    return this;
  }

  build(): UserDto {
    return { ...this.user };
  }
}
