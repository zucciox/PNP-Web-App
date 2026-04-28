export interface Unit {
    unit_type: string;
    type_id: number;
    max_health: number;
    health: number;
    nation_id: string;
    oc_interval: number;
    is_active: boolean;
    damage: number;
    speed: number;
    num_attacks: number;
    attack_range: number;
    inactive_settlement: number;
    inactive_facility: number;
}
  
export interface Facility {
    global_id: number;
    facility_type: string;
    owner_nation: string;
    output_amount_interval: number;
    output_type: string;
    needs_workers: string;
    workers_assigned: string;
    mine_level: string;
    input_type: string;
    tier: string;
    oc_interval: number;
    type_id: number;
    Energy: number;
    Gas: number;
    Coal: number;
    Fuel: number;
    Water: number;
    Food: number;
    Oxygen: number;
    Steel: number;
    Aluminum: number;
    Copper: number;
    Platinum: number;
    Titanium: number;
    Gold: number;
    Diamond: number;
    Uranium: number;
    Oil: number; 
    Methane: number; 
    NaturalGas: number; 
    CopperOre: number;
    GoldOre: number;
    IronOre: number;
    AluminumOre: number;
    TitaniumOre: number;
    PlatinumOre: number;
    UraniumOre: number;
}

export interface Settlement {
    global_id: number;
    name: string;
    owner_nation: string;
    Treasury: number;
    Energy: number;
    Gas: number;
    Coal: number;
    Fuel: number;
    Water: number;
    Food: number;
    Oxygen: number;
    Steel: number;
    Aluminum: number;
    Copper: number;
    Platinum: number;
    Titanium: number;
    Gold: number;
    Diamond: number;
    Uranium: number;
    treasury_cr: number;
    energy_cr: number;
    gas_cr: number;
    coal_cr: number;
    fuel_cr: number;
    water_cr: number;
    food_cr: number;
    oxygen_cr: number;
    steel_cr: number;
    aluminum_cr: number;
    copper_cr: number;
    platinum_cr: number;
    titanium_cr: number;
    gold_cr: number;
    diamond_cr: number;
    uranium_cr: number;
}

export interface NationData {
    id: string;
    Treasury: number;
    Energy: number;
    Gas: number;
    Coal: number;
    Fuel: number;
    Water: number;
    Food: number;
    Steel: number;
    Aluminum: number;
    Copper: number;
    Platinum: number;
    Titanium: number;
    Gold: number;
    Diamond: number;
    Uranium: number;
}

export interface resourceStockpileData {
    nation_id: string;
    Treasury: number;
    Energy: number;
    Gas: number;
    Coal: number;
    Fuel: number;
    Water: number;
    Food: number;
    Steel: number;
    Aluminum: number;
    Copper: number;
    Platinum: number;
    Titanium: number;
    Gold: number;
    Diamond: number;
    Uranium: number;
}

export interface Shipment {
    shipment_id: number,
    origin_nation: string,
    unit_id: number,
    unit_type: number,
    resource: string,
    destination: string,
    amount: number,
    notes: string;
}
