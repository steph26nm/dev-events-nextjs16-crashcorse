'use client';
import Image from "next/image";

export default function ExploreBtn() {
  return (
    <button type="button" id="explore-btn" className="mt-7 mx-auto " onClick={() => console.log('CLICK')}>
        <a href="#events" alt="explore-events">Explore Events</a>
        <Image src="/icons/arrow-down.svg" alt="down-arrow" width={24} height={24} />
    </button>
  )
}
