import {
  Accessibility,
  Anchor,
  Bath,
  BedDouble,
  Bike,
  Building2,
  Bus,
  Camera,
  Car,
  Coffee,
  Container,
  CookingPot,
  Droplets,
  Dumbbell,
  Fan,
  Fish,
  Flame,
  Forklift,
  Fuel,
  Heater,
  IceCreamBowl,
  Lamp,
  Laptop,
  LifeBuoy,
  Mail,
  Microwave,
  Music,
  PlugZap,
  Recycle,
  Refrigerator,
  ShieldCheck,
  ShowerHead,
  Snowflake,
  Store,
  Trees,
  Tv,
  UserRound,
  Utensils,
  Warehouse,
  WashingMachine,
  Waves,
  Wifi,
  Wine,
  Wrench,
  Zap,
} from "lucide-react";

export function FeatureIcon({ feature }: { feature: string }) {
  const value = feature.toLowerCase();
  let Icon = BedDouble;

  if (value.includes("accessible bathroom")) Icon = Accessibility;
  else if (value.includes("bathroom")) Icon = Bath;
  else if (value.includes("shower")) Icon = ShowerHead;
  else if (value.includes("kitchen")) Icon = CookingPot;
  else if (value.includes("bbq")) Icon = Flame;
  else if (value.includes("air condition")) Icon = Snowflake;
  else if (value.includes("heating")) Icon = Heater;
  else if (value.includes("wi-fi") || value.includes("wifi")) Icon = Wifi;
  else if (value.includes("workspace")) Icon = Laptop;
  else if (value === "tv") Icon = Tv;
  else if (value.includes("refrigerator")) Icon = Refrigerator;
  else if (value.includes("freezer")) Icon = Snowflake;
  else if (value.includes("oven")) Icon = CookingPot;
  else if (value.includes("microwave")) Icon = Microwave;
  else if (value.includes("coffee")) Icon = Coffee;
  else if (value.includes("dishwasher")) Icon = WashingMachine;
  else if (value.includes("hot water")) Icon = Droplets;
  else if (value.includes("deck shower")) Icon = ShowerHead;
  else if (value.includes("washing machine") || value === "dryer") Icon = WashingMachine;
  else if (value === "fans") Icon = Fan;
  else if (value.includes("mosquito screen")) Icon = ShieldCheck;
  else if (value.includes("sound system")) Icon = Music;
  else if (value.includes("bedding") || value.includes("linens")) Icon = BedDouble;
  else if (value.includes("cctv")) Icon = Camera;
  else if (value.includes("night lighting")) Icon = Lamp;
  else if (value.includes("locked pontoon")) Icon = Anchor;
  else if (value.includes("security") || value.includes("gated")) Icon = ShieldCheck;
  else if (value.includes("laundry")) Icon = WashingMachine;
  else if (value.includes("cafe") || value.includes("bar")) Icon = Wine;
  else if (value.includes("restaurant")) Icon = Utensils;
  else if (value.includes("clubhouse")) Icon = Building2;
  else if (value.includes("gym")) Icon = Dumbbell;
  else if (value.includes("sauna")) Icon = Heater;
  else if (value.includes("grocery") || value.includes("chandlery")) Icon = Store;
  else if (value.includes("picnic") || value.includes("beach") || value.includes("play area"))
    Icon = Trees;
  else if (value.includes("parking")) Icon = Car;
  else if (value.includes("ev charging")) Icon = PlugZap;
  else if (value.includes("fuel")) Icon = Fuel;
  else if (value.includes("gas refill")) Icon = Flame;
  else if (value.includes("waste") || value.includes("recycling")) Icon = Recycle;
  else if (value === "ice") Icon = IceCreamBowl;
  else if (value.includes("marina staff")) Icon = UserRound;
  else if (value.includes("mail") || value.includes("package")) Icon = Mail;
  else if (value.includes("pump-out")) Icon = Container;
  else if (value.includes("fresh water")) Icon = Droplets;
  else if (value.includes("boatyard") || value.includes("dry storage")) Icon = Warehouse;
  else if (value.includes("marine engineer")) Icon = Wrench;
  else if (value.includes("travel lift") || value.includes("crane")) Icon = Forklift;
  else if (value.includes("slipway")) Icon = Anchor;
  else if (value.includes("public transport")) Icon = Bus;
  else if (value.includes("airport") || value.includes("taxi")) Icon = Car;
  else if (value.includes("bicycle")) Icon = Bike;
  else if (value.includes("snorkel")) Icon = Fish;
  else if (
    value.includes("pool") ||
    value.includes("kayak") ||
    value.includes("paddle") ||
    value.includes("swim")
  )
    Icon = Waves;
  else if (value.includes("tender")) Icon = LifeBuoy;
  else if (value.includes("power")) Icon = Zap;
  else if (value.includes("water")) Icon = Droplets;
  else if (value.includes("dock")) Icon = Anchor;

  return <Icon className="text-teal" size={18} />;
}
