"use client";
import { InputAddressType } from "@/src/components/GoogleMap";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import PickupAddressMap from "@/src/components/GoogleMap";

export default function Sos() {
  return (
    <div className="relative z-30 flex w-full flex-col items-center justify-center p-4 font-dmsans ">
      <div className="flex h-fit w-full flex-col items-center justify-center">
        <FormComponent />
      </div>
    </div>
  );
}

function FormComponent() {
  const [mapError, setMapError] = useState<string>();
  const [pickupAddress, setPickupAddress] = useState<InputAddressType>({
    lat: 0,
    lng: 0,
    name: "",
    city: "",
    state: "",
    pincode: ""
  });

  const searchParams = useSearchParams();

  useEffect(() => {
    const lat = parseFloat(searchParams.get("lat") || "0");
    const lng = parseFloat(searchParams.get("lng") || "0");

    setPickupAddress({
      lat,
      lng,
      name: "",
      city: "",
      state: "",
      pincode: ""
    });
  }, [searchParams]);

  return (
    <div className="flex w-full flex-col gap-6 font-dmsans">
      <div className="flex w-full flex-col justify-start gap-1">
        <PickupAddressMap
          pickupAddress={pickupAddress}
          setPickupAddress={setPickupAddress}
          setMapError={setMapError}
        />
        {mapError && (
          <p className="error-message font-dmsans text-sm">{mapError}</p>
        )}
      </div>
      <hr className="border-t-1 border-gray-400"></hr>
      <div
        style={{
          boxShadow: "2px -2px 4px 0px #0000001A"
        }}
        className="fixed bottom-0 z-10 -ml-4 flex w-full items-center justify-center rounded-t-2xl bg-white p-4"
      >
        <button
          name="_action"
          value={"sos"}
          // onClick={onSubmit}
          // disabled={navigation.state !== "idle"}
          className="flex w-full items-center justify-center rounded-full bg-red-700 py-3 font-dmsans text-base font-bold text-white"
        >
          SUBMIT
        </button>
      </div>
    </div>
  );
}
