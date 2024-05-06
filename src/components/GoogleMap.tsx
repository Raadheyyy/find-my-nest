import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { useCallback, useEffect, useRef, useState } from "react";
import { getAddressFromGooglePlaceSearch } from "@/src/utils/map-utils";
import { useSearchParams } from "next/navigation";

export type InputAddressType = {
  lat: number;
  lng: number;
  name: string;
  city: string;
  state: string;
  pincode: string;
};

const libraries: ("drawing" | "geometry" | "places" | "visualization")[] = [
  "places"
];

export default function InputAddressMap({
  pickupAddress,
  setPickupAddress,
  setMapError
}: {
  pickupAddress: InputAddressType;
  setPickupAddress: (address: InputAddressType) => void;
  setMapError: (error: string) => void;
}) {
  const params = useSearchParams();
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY as string,
    libraries
  });

  const mapContainerStyle = {
    width: "100%",
    height: "200px",
    border: "2px solid #D2D6DB",
    borderRadius: "12px"
  };
  useEffect(() => {
    if (!isLoaded) return;
    if (!pickupAddress.lat || !pickupAddress.lng) return;
    setPickupAddressDataUsingGeocode({
      lat: pickupAddress.lat,
      lng: pickupAddress.lng
    });
  }, [isLoaded, pickupAddress.lat, pickupAddress.lng]);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const onLoad = useCallback(
    function callback(map: google.maps.Map) {
      const bounds = new window.google.maps.LatLngBounds({
        lat: pickupAddress.lat,
        lng: pickupAddress.lng
      });
      map.fitBounds(bounds);

      setMap(map);
    },
    [pickupAddress]
  );

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  const setPickupAddressDataUsingGeocode = ({
    lat,
    lng
  }: {
    lat: number;
    lng: number;
  }) => {
    const geoCoder = new google.maps.Geocoder();
    geoCoder.geocode(
      {
        location: new google.maps.LatLng(lat, lng)
      },
      (results, status) => {
        if (status === "OK" && results && results.length > 0) {
          if (results[0]) {
            const addressComponents = results[0].address_components;
            const city = addressComponents.find((component) =>
              component.types.includes("locality")
            );
            const state = addressComponents.find((component) =>
              component.types.includes("administrative_area_level_1")
            );
            const pincode = addressComponents.find((component) =>
              component.types.includes("postal_code")
            );
            setPickupAddress({
              lat: lat,
              lng: lng,
              name: results[0].formatted_address,
              city: city?.long_name || "",
              state: state?.long_name || "",
              pincode: pincode?.long_name || ""
            });
          }
        }
      }
    );
  };

  const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      setPickupAddressDataUsingGeocode({
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      });
    }
  }, []);

  const handleMapDrag = () => {
    if (map) {
      const mapCenter = map.getCenter();
      setPickupAddressDataUsingGeocode({
        lat: Number(mapCenter?.lat()),
        lng: Number(mapCenter?.lng())
      });
    }
  };

  const mapOptions = useRef({
    zoomControl: false,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
    mapId: "f067f7b3872c829b",
    disableDefaultUI: true,
    zoom: 10
  });

  const centerPoint: google.maps.LatLngLiteral = {
    lat: pickupAddress.lat,
    lng: pickupAddress.lng
  };

  const successCallback = useCallback(
    (position: { coords: { latitude: any; longitude: any } }) => {
      const { latitude, longitude } = position.coords;
      console.log(latitude, longitude);
      setPickupAddress({
        lat: latitude,
        lng: longitude,
        name: "",
        city: "",
        state: "",
        pincode: ""
      });
    },
    [setPickupAddress]
  );

  const errorCallback: PositionErrorCallback = (error) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        console.log("User denied the request for Geolocation.");
        setMapError("You have not provided location access");
        break;
      case error.POSITION_UNAVAILABLE:
        console.log("Location information is unavailable.");
        setMapError("Location is not available at the moment");
        break;
      case error.TIMEOUT:
        console.log("The request to get user location timed out.");
        setMapError("You have not provided location access");
        break;
      default:
        console.log("An unknown error occurred.");
        setMapError("Please provide location access");
        break;
    }
  };

  const accessPosition = useCallback(() => {
    if (params.get("lat") && params.get("lng")) {
      successCallback({
        coords: {
          latitude: params.get("lat"),
          longitude: params.get("lng")
        }
      });
      return;
    }
    const geolocationLoc = navigator.geolocation;
    // If geolocation is available, try to get the visitor's position
    if (geolocationLoc) {
      geolocationLoc.getCurrentPosition(successCallback, errorCallback);
    } else {
      alert("Sorry, your browser does not support HTML5 geolocation.");
    }
  }, [params, successCallback]);

  const detectLocation: React.MouseEventHandler<HTMLButtonElement> =
    useCallback(() => {
      accessPosition();
    }, [accessPosition]);

  return (
    <>
      <PickupAddressInput
        isMapsLoaded={isLoaded}
        pickupAddress={pickupAddress}
        setPickupAddress={setPickupAddress}
        detectLocation={detectLocation}
      />
      {!isLoaded ? (
        <div className="relative h-[200px] w-full overflow-hidden rounded-lg border-2 border-gray-300">
          <div className="absolute inset-0 bg-gray-300 opacity-50"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <p>Loading...</p>
          </div>
        </div>
      ) : (
        <div style={{ width: "100%", height: "200px", position: "relative" }}>
          <GoogleMap
            onLoad={onLoad}
            onUnmount={onUnmount}
            mapContainerStyle={mapContainerStyle}
            center={centerPoint}
            onDragEnd={handleMapDrag}
            onClick={handleMapClick}
            onZoomChanged={handleMapDrag}
            options={mapOptions.current}
          ></GoogleMap>
          {pickupAddress.lat && pickupAddress.lng ? (
            <div style={{ position: "absolute", top: "50%", left: "50%" }}>
              <div style={{ transform: "translate(-50%, -50%)" }}>
                <img src="/icons/pickup_shadow.svg" alt="" />
              </div>
            </div>
          ) : (
            <div
              style={{ position: "absolute", top: "50%", left: "50%" }}
              className="rounded-md"
            >
              <div style={{ transform: "translate(-50%, -50%)" }}>
                <button
                  onClick={detectLocation}
                  className="rounded-full border-none bg-red-300 px-5 py-3 text-red-700"
                >
                  Locate Me
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function PickupAddressInput({
  isMapsLoaded,
  pickupAddress,
  setPickupAddress,
  detectLocation
}: {
  isMapsLoaded: boolean;
  pickupAddress: InputAddressType;
  setPickupAddress: (address: InputAddressType) => void;
  detectLocation: React.MouseEventHandler<HTMLButtonElement>;
}) {
  const addressRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isMapsLoaded) return;
    if (addressRef.current) {
      const autocomplete = new google.maps.places.Autocomplete(
        addressRef.current,
        {
          componentRestrictions: { country: "in" },
          fields: ["address_components", "geometry", "icon", "name"],
          strictBounds: false,
          types: ["establishment", "geocode"]
        }
      );
      autocomplete.addListener("place_changed", () => {
        const { lat, lng, city, state, placeName, pincode } =
          getAddressFromGooglePlaceSearch(autocomplete.getPlace());

        setPickupAddress({
          lat: Number(lat),
          lng: Number(lng),
          city: city || "",
          state: state || "",
          name: placeName || "",
          pincode: pincode || ""
        });
      });
    }
  }, [isMapsLoaded, setPickupAddress]);

  useEffect(() => {
    const pickupAddressElement = document.getElementById(
      "pickupAddress"
    ) as HTMLInputElement;
    if (pickupAddressElement) {
      pickupAddressElement.value = pickupAddress.name;
    }
  }, [pickupAddress.name]);

  return (
    <>
      <input
        type={"hidden"}
        id="pickupAddressLat"
        name="pickupAddressLat"
        value={`${pickupAddress.lat}`}
      />
      <input
        type={"hidden"}
        id="pickupAddressLng"
        name="pickupAddressLng"
        value={`${pickupAddress.lng}`}
      />
      <input
        type={"hidden"}
        id="pickupAddressName"
        name="pickupAddressName"
        value={pickupAddress.name}
      />
      <input
        type={"hidden"}
        id="pickupAddressCity"
        name="pickupAddressCity"
        value={pickupAddress.city}
      />
      <input
        type={"hidden"}
        id="pickupAddressState"
        name="pickupAddressState"
        value={pickupAddress.state}
      />
      <input
        type={"hidden"}
        id="pickupAddressPincode"
        name="pickupAddressPincode"
        value={pickupAddress.pincode}
      />
      <div className="flex flex-row justify-between">
        <label
          className="label-white-lg w-fit text-sm font-medium text-guardians-blue-text"
          htmlFor="place-search"
        >
          Patient Address
        </label>
        <button
          onClick={detectLocation}
          className="text-left text-sm text-guardians-red"
        >
          Detect Location
        </button>
      </div>
      <div className="flex items-center overflow-hidden rounded-md border-none border-gray-400 bg-[#111E3B0F]">
        <input
          className="w-full appearance-none border-none bg-[#111E3B0F] px-2  py-3 font-dmsans leading-tight text-guardians-blue-text focus:outline-none"
          id="pickupAddress"
          name="pickupAddress"
          ref={addressRef}
          defaultValue={pickupAddress.name}
          placeholder="Enter patient address..."
        />
      </div>
    </>
  );
}
