import { Table, pk, sk } from "./tableDecorator";

@Table("tableName")
export class ATable {
  // @pk
  // pk: string;
  // @sk
  // sk: string;
}

// 各playerはユニークなplayerID (string) を持っている * player テーブルはここでは無視する
// 各characterはユニークなcharacterID (string) を持っている
// 各weaponはユニークなweaponID (string) を持っている

// characterは他にも name, characterDataID (マスターデータのID) などを持っている
// weaponは他にも name, weaponDataId (マスターデータのID) などを持っている

// characters

// GET https://..../characters/playerId
// あるplayer１人の全characterを入手

// GET https://..../characters/character/playerId/characterId
// あるplayerのあるcharacterを入手

// POST https://..../characters/new/playerId/characterId
// あるplayerにあるcharacterを付与

// POST https://..../characters/equip/playerId/characterId/weaponId
// あるplayerのあるcharacterにあるweaponを装着

// POST https://..../characters/remove/playerId/characterId/weaponId
// あるplayerのあるcharacterについているはずのweaponを脱着

// weapons

// GET https://..../weapons/playerId
// あるplayer１人の全weaponを入手

// GET https://..../weapons/playerId/weaponId
// あるplayerのあるweaponを入手

// POST https://..../weapons/new/playerId/weaponId
// あるplayerにあるweaponを付与
