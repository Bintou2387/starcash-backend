import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 1. Inscription (Créer un user)
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // 2. Voir tous les users (Pour vérifier)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // 3. Voir un seul user par son ID
  @Get(':id')
  findOne(@Param('id') id: string) { // <-- On précise que c'est un String (UUID)
    return this.usersService.findOne(id); // <-- On a retiré le '+' ici !
  }
}