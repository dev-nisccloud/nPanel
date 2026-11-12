const office = (name: string, alt: string) => ({
  src: `/careers/${name}-1280.webp`,
  srcSet: `/careers/${name}-640.webp 640w, /careers/${name}-1280.webp 1280w, /careers/${name}-1920.webp 1920w, /careers/${name}-2560.webp 2560w`,
  alt,
});

export type OfficePhoto = ReturnType<typeof office>;

export const OFFICE_PHOTOS = {
  team: office("office-team", "The Nisc Cloud team at work in the Nairobi office"),
  glass: office("office-glass", "Glass doors and meeting room at the Nisc Cloud office in Nairobi"),
  reception: office("office-reception", "Reception at the Nisc Cloud office, with the Get online. Stay online. Grow your business. wall"),
  workstations: office("office-workstations", "The Nisc Cloud open office, with the Your business. Online. Secure. Growing. wall"),
  lobby: office("office-lobby", "The Nisc Cloud lobby, with the reception desk, waiting area and blue brand wall"),
  openplan: office("office-openplan", "Rows of workstations in the Nisc Cloud open-plan office"),
  support: office("office-support", "The Nisc Cloud client support team at their desks with headsets"),
  boardroom: office("office-boardroom", "The Nisc Cloud boardroom behind glass walls"),
  corridor: office("office-corridor-wide", "Glass-walled corridor of meeting rooms at Nisc Cloud"),
};
