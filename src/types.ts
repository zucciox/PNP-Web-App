// Define the Profile interface
export interface Profile {
    id: string;
    nation_id: string;
    role: string;
    // Add other profile fields here (e.g., username, avatar_url)
  }

export interface CombatExchange {
    id: number;
    aggressor_nation: string;
    victim_nation: string;
    aggressor_piece: number;
    victim_unit: number;
    victim_facility: number;
    victim_settlement: number;
    is_resolved: boolean;
    is_disputed: boolean;
    aggressor_label: string;
    damage: number;
}

export interface Notification {
    id: number;
    created_at: EpochTimeStamp;
    body: string;
    header: string;
    receiving_nation: string;
    is_admin: boolean;
    is_resolved: boolean;
}

export interface Unit {
    global_id: number;
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
    attacks_remaining: number;
    worked_facility: number;
}

export interface UnitType {
    unit_type: string;
    max_health: number;
    oc_interval: number;
    damage: number;
    speed: number;
    num_attacks: number;
    attack_range: number;
    TreasuryCost: number;
    SteelCost: number;
    AluminumCost: number;
    CopperCost: number;
    PlatinumCost: number;
    TitaniumCost: number;
    GoldCost: number;
    DiamondCost: number;
    UraniumCost: number;
    build_time: number;
    factory_lvl: number;
    is_shipment_enabled: boolean;
    [key: string]: string | number | boolean;
}
  
export interface Facility {
    global_id: number;
    facility_type: string;
    is_active: boolean;
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
    health: number;
    [key: string]: any;
}


export interface FacilityType {
    facility_type: string;
    mfg_level: number;
    output_amount_interval: number;
    output_type: string;
    needs_workers: boolean;
    mine_level: string;
    input_type: string;
    oc_interval: number;
    TreasuryCost: number;
    SteelCost: number;
    AluminumCost: number;
    CopperCost: number;
    PlatinumCost: number;
    TitaniumCost: number;
    GoldCost: number;
    DiamondCost: number;
    UraniumCost: number;
    build_time: number;
    factory_lvl: number;
    proprietary_nation: string;
    is_purchasable: boolean;
    is_variable_output: boolean;
    [key: string]: any;
}

export interface Settlement {
    global_id: number;
    type_id: number;
    name: string;
    settlement_type: string;
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
    health: number;
    [key: string]: string | number;
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

export interface gameStateData {
    interval: number;
    cycle: number;
    next_interval_time: string;
    hiactive: boolean;
    id: number;
    queue_action: string;
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


export interface Nation {
    id: string;
    Treasury: number;
    interval_income: number;
    [key: string]: string | number;
}


export interface Order {
    order_id: number;
    intervals_remaining: number;
    nation_id: string;
    facility_id: number;
    piece_type: string;
    [key: number]: string | number;
}
