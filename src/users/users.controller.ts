import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 1. Inscription
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // 2. Mettre à jour la photo (NOUVEAU - Bien placé à l'intérieur)
  @Post('avatar')
  updateAvatar(@Body() body: { userId: string; image: string }) {
    return this.usersService.updateAvatar(body.userId, body.image);
  }

  // 3. Voir tous les users
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // 4. Voir un user par ID
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}