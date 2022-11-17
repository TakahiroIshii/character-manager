import { Table, pk, sk } from "./tableDecorator";

@Table("Inventory")
export class Inventory {
  @pk
  player_id: string;
  @sk
  sk: string;
}

export class Character extends Inventory {
  player_id: string;
  sk: string;
  equipped: string;
  character_data_id: string;
  character_name: string;
}

export class Weapon extends Inventory {
  player_id: string;
  sk: string;
  equippedOn: string;
  weapon_data_id: string;
  weapon_name: string;
}

export enum Prefix {
  character = "character_",
  weapon = "weapon_",
}
