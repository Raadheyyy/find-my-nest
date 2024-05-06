export function getAddressFromGooglePlaceSearch(
  place: google.maps.places.PlaceResult
): {
  addressString: string | undefined;
  city?: string;
  state?: string;
  placeId?: string;
  lat: string | undefined;
  lng: string | undefined;
  placeName?: string;
  pincode?: string;
} {
  // console.log(place.name, place.address_components);
  console.log(place);

  const addressString = place.address_components
    ?.map((addressComponent) => addressComponent.long_name)
    .join(", ");

  const cityComponents = place.address_components
    ?.filter(
      (component) =>
        component.types.includes("locality") ||
        component.types.includes("administrative_area_level_3")
    )
    .map((component) => component.long_name);

  const stateComponents = place.address_components
    ?.filter((component) =>
      component.types.includes("administrative_area_level_1")
    )
    .map((component) => component.long_name);

  const postalCode = place.address_components
    ?.filter((component) => component.types.includes("postal_code"))
    .map((component) => component.long_name);
  console.log(cityComponents, stateComponents, postalCode);

  return {
    placeId: place.place_id,
    placeName: place.name,
    addressString,
    lat: place.geometry?.location?.lat().toString(),
    lng: place.geometry?.location?.lng().toString(),
    city:
      cityComponents && cityComponents.length > 0
        ? cityComponents[0]
        : undefined,
    state:
      stateComponents && stateComponents.length > 0
        ? stateComponents[0]
        : undefined,
    pincode: postalCode && postalCode.length > 0 ? postalCode[0] : undefined,
  };
}
