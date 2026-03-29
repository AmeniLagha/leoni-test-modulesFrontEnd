import { UploadService } from './../../../../../services/upload.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { CommonModule, TitleCasePipe } from '@angular/common'; // <-- Importer TitleCasePipe
import { ChargeSheetService } from '../../../../../services/charge-sheet.service';
import { ExcelExportService } from '../../../../../services/excel-export.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-charge-sheet-detail',
  standalone: true, // si c'est un composant standalone
  imports: [CommonModule, TitleCasePipe], // <-- Ajouter ici
  templateUrl: './charge-sheet-detail.component.html',
  styleUrls: ['./charge-sheet-detail.component.css']
})
export class ChargeSheetDetailComponent implements OnInit {
  chargeSheet: any;
  loading = true;
  error: string | null = null;
   imageUrls: { [key: string]: string } = {};

  constructor(
    private route: ActivatedRoute,
    private chargeSheetService: ChargeSheetService,
       private excelExportService: ExcelExportService,
       public uploadService : UploadService
  ) {}

 ngOnInit(): void {
  const id = this.route.snapshot.paramMap.get('id');
  if (id) {
    this.chargeSheetService.getById(+id).subscribe({ // <-- note le +id pour convertir en number
      next: (data) => {
        this.chargeSheet = data;
        this.loading = false;
         this.loadImages();
      },
      error: (err) => {
        console.error('Erreur API:', err); // <-- ajouter log pour debug
        this.error = 'Impossible de charger le cahier de charge.';
        this.loading = false;
      }
    });
  }
}
 loadImages(): void {
    if (!this.chargeSheet) return;

    for (const [key, value] of Object.entries(this.chargeSheet)) {
      if (key === 'realConnectorPicture' && typeof value === 'string' && value.trim() !== '') {
        // Souscrire à l'observable pour obtenir l'URL
        this.uploadService.getImageUrl(value).subscribe({
          next: (url) => {
            this.imageUrls[key] = url;
          },
          error: (err) => {
            console.error('Erreur chargement image:', err);
          }
        });
      }
    }
  }


 exportToExcel(): void {
    if (this.chargeSheet) {
      const fileName = `cahier_charge_${this.chargeSheet.id}_${new Date().toISOString().split('T')[0]}.xlsx`;
      this.excelExportService.exportChargeSheetToExcel(this.chargeSheet, fileName);
    }
  }

  // Récupérer les champs d'un objet
  getFields(obj: any): [string, any][] {
    return obj ? Object.entries(obj) : [];
  }

  // Récupérer les autres champs (hors basic et tech)
  getOtherFields(): { label: string; value: any }[] {
    if (!this.chargeSheet) return [];

    const excludeFields = ['basic', 'tech', 'id'];
    const result = [];

    for (const [key, value] of Object.entries(this.chargeSheet)) {
      if (!excludeFields.includes(key) && value !== undefined && value !== null) {
        result.push({
          label: this.formatLabel(key),
          value: this.formatValue(value)
        });
      }
    }

    return result;
  }

  // Formater le label
 formatLabel(key: string): string {
  if (!key) return '';

  const map: { [k: string]: string } = {
    id: 'ID',
    plant: 'Plant',
    project: 'Project',
    harnessref: 'Harness Ref',
    issuedby: 'Issued By',
    emailaddress: 'Email Address',
    phonenumber: 'Phone Number',
    ordernumber: 'Order Number',
    costcenternumber: 'Cost Center Number',
    date: 'Date',
    preferreddeliverydate: 'Preferred Delivery Date',
    itemnumber: 'Item Number',
    samplesexist: 'Samples Existe',
    ways: 'Ways',
    housingcolour: 'Housing Colour',
    testmoduleexistindatabase: 'Test Module Existe dans la Base',
    housingreferenceleoni: 'Housing Reference Leoni',
    housingreferencesuppliercustomer: 'Housing Reference Supplier/Customer',
    referencesealsclipscabletiescap: 'Reference Seals/Clips/Cable Ties/Cap',
    realconnectorpicture: 'Real Connector Picture',
    quantityoftestmodules: 'Quantity of Test Modules',
    outsidehousingexist: 'Outside Housing Existe',
    insidehousingexist: 'Inside Housing Existe',
    mechanicalcoding: 'Mechanical Codage',
    electricalcoding: 'Electrical Codage',
    cpaexistopen: 'CPA Existe Open',
    cpaexistclosed: 'CPA Existe Closed',
    coverhoodexist: 'Cover Hood Existe',
    coverhoodclosed: 'Cover Hood Closed',
    capexist: 'Cap Existe',
    bayonetcapexist: 'Bayonet Cap Existe',
    bracketexist: 'Bracket Existe',
    bracketopen: 'Bracket Open',
    bracketclosed: 'Bracket Closed',
    latchwingexist: 'Latch Wing Existe',
    sliderexist: 'Slider Existe',
    slideropen: 'Slider Open',
    sliderclosed: 'Slider Closed',
    secondarylockexist: 'Secondary Lock Existe',
    secondarylockopen: 'Secondary Lock Open',
    secondarylockclosed: 'Secondary Lock Closed',
    offsettest: 'Offset Test',
    pushbacktest: 'Push Back Test',
    terminalorientation: 'Terminal Orientation',
    terminaldifferentiation: 'Terminal Differentiation',
    airbagtestviaservicewindow: 'Airbag Test via Service Window',
    leaktestpressure: 'Leak Test Pressure',
    leaktestvacuum: 'Leak Test Vacuum',
    sealexist: 'Seal Existe',
    cabletieexist: 'Cable Tie Existe',
    cabletieleft: 'Cable Tie Left',
    cabletieright: 'Cable Tie Right',
    cabletiemiddle: 'Cable Tie Middle',
    cabletieleftright: 'Cable Tie Left/Right',
    clipexist: 'Clip Existe',
    screwexist: 'Vis Existe',
    nutexist: 'Écrou Existe',
    convolutedconduitexist: 'Convoluted Conduit Existe',
    convolutedconduitclosed: 'Convoluted Conduit Closed',
    antennaonlypresencetest: 'Antenna Only Presence Test',
    antennaonlycontactingofshield: 'Antenna Only Contacting Shield',
    antennacontactingofshieldandcorewire: 'Antenna Contacting Shield and Core Wire',
    ringterminal: 'Ring Terminal',
    diameterinside: 'Diameter Inside',
    diameteroutside: 'Diameter Outside',
    singlecontact: 'Single Contact',
    heatshrinkexist: 'Heat Shrink Existe',
    openshuntsairbag: 'Open Shunts Airbag',
    flowtest: 'Flow Test',
    solidmetalcontour: 'Solid Metal Contour',
    metalcontouradjustable: 'Metal Contour Adjustable',
    grommetexist: 'Grommet Existe',
    grommetorientation: 'Grommet Orientation',
    cablechannelexist: 'Cable Channel Existe',
    cablechannelclosed: 'Cable Channel Closed',
    colouredetectionprepared: 'Colour Detection Prepared',
    extraled: 'Extra LED',
    spring: 'Spring',
    otherdetection: 'Other Detection',
    spacerclosingunit: 'Spacer Closing Unit',
    leaktestcomplex: 'Leak Test Complex',
    pinstraightnesscheck: 'Pin Straightness Check',
    presencetestofonesideconnectedshield: 'Presence Test of One Side Connected Shield',
    contrastdetectiongreyvaluesensor: 'Contrast Detection Grey Value Sensor',
    colouredetection: 'Colour Detection',
    attenuationwithmodescrambler: 'Attenuation With Mode Scrambler',
    attenuationwithoutmodescrambler: 'Attenuation Without Mode Scrambler',
    insulationresistance: 'Insulation Resistance',
    highvoltagemodule: 'High Voltage Module',
    kelvinmeasurementhv: 'Kelvin Measurement HV',
    actuatortesthv: 'Actuator Test HV',
    chargingsystemelectrical: 'Charging System Electrical',
    ptupipetestunit: 'PTU Pipe Test Unit',
    gtugrommettestunit: 'GTU Grommet Test Unit',
    ledledtestmodule: 'LED Test Module',
    tigterminalinsertionguidance: 'TIG Terminal Insertion Guidance',
    linbusfunctionalitytest: 'LIN Bus Functionality Test',
    canbusfunctionalitytest: 'CAN Bus Functionality Test',
    esdconformmodule: 'ESD Conform Module',
    fixedblock: 'Fixed Block',
    movingblock: 'Moving Block',
    tiltmodule: 'Tilt Module',
    slidemodule: 'Slide Module',
    handadapter: 'Hand Adapter',
    lsmleonismartmodule: 'LSM Leoni Smart Module',
    leonistandardtesttable: 'Leoni Standard Test Table',
    metalrailsfasteningsystem: 'Metal Rails Fastening System',
    metalplatesfasteningsystem: 'Metal Plates Fastening System',
    quickconnectionbycanonconnector: 'Quick Connection by Canon Connector',
    testboard: 'Test Board',
    weetech: 'Weetech',
    bak: 'BAK',
    ogc: 'OGC',
    adaptronichighvoltage: 'Adaptronic High Voltage',
    emdephvbananaplug: 'Emdep HV Banana Plug',
    leoniemostandardhv: 'Leoni EMO Standard HV',
    cliporientation: 'Clip Orientation',
    unitprice: 'Unit Price',
    totalprice: 'Total Price',
    status: 'Status',
    createdby: 'Created By',
    createdat: 'Created At',
    updatedby: 'Updated By',
    updatedat: 'Updated At'
  };

  const keyLower = key.toLowerCase();
  if (map[keyLower]) return map[keyLower];

  // Sinon mettre en Title Case simple
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}


  // Formater la valeur
  formatValue(value: any): string {
    if (value === null || value === undefined) return '-';
    if (value === '*') return '✓ Oui';
    if (value === '') return '✗ Non';
    if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
    if (value instanceof Date) return value.toLocaleDateString('fr-FR');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }
getFieldDisplay(chargeSheetId: number, fieldName: string, value: any): string | null {
  // Si c'est le champ image, retourner null pour signaler qu'on affichera <img>
  if (fieldName === 'realConnectorPicture' && value) return null;
  return value ?? '-';
}

}
