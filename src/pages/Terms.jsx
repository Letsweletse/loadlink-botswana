import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';

const UPDATED = "31 July 2026";

export default function Terms() {
  return (
    <div className="max-w-lg mx-auto bg-[#FFF8EC] min-h-screen">
      <div className="bg-[#3D2B0E] px-4 pt-12 pb-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center">
            <ArrowLeft className="h-4 w-4 text-white" />
          </Link>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Legal</p>
            <h1 className="text-lg font-extrabold text-white tracking-tight">Terms of Use</h1>
          </div>
        </div>
      </div>

      <div className="p-5 pb-16 space-y-5 text-sm text-[#3D2B0E] leading-6">
        <p className="text-xs text-[#B08A45] font-semibold">Last updated: {UPDATED}</p>

        <p>
          These Terms of Use ("Terms") govern your access to and use of Van-Link, an on-demand
          logistics platform operated by IBLIM Enterprise (Pty) Ltd ("Van-Link", "we", "us")
          connecting clients with independent drivers and vehicle owners in Botswana.
          By creating an account or using the app, you agree to these Terms.
        </p>

        <Section title="1. Who can use Van-Link">
          You must be at least 18 years old and legally able to enter into a binding contract
          in Botswana. Drivers must hold a valid driving licence for the vehicle category
          they register and comply with all applicable road transport laws, including BA
          permit, fitness certificate, and insurance requirements.
        </Section>

        <Section title="2. What Van-Link is (and isn't)">
          Van-Link is a booking and matching platform. We connect clients who need goods
          transported with independent drivers who accept those jobs. Van-Link is not a
          transport operator, does not own vehicles, and does not employ drivers. Drivers
          are independent contractors responsible for their own vehicles, licensing, and
          conduct.
        </Section>

        <Section title="3. Bookings and fares">
          Fares shown at booking are estimates based on distance and vehicle category.
          Final fares are confirmed once a driver accepts. Van-Link deducts a commission
          from each completed booking, disclosed at the time of acceptance. Payment methods
          and settlement are handled through the app's wallet system.
        </Section>

        <Section title="4. Driver responsibilities">
          Drivers must keep their licence, BA permit, fitness certificate, and insurance
          current and upload accurate documentation. Van-Link may suspend a vehicle or
          driver account if documents expire, are found inaccurate, or if repeated
          complaints are received. Drivers are solely responsible for the safe transport
          and condition of goods in their care.
        </Section>

        <Section title="5. Client responsibilities">
          Clients must provide accurate pickup/dropoff details and an honest description
          of goods being transported. Van-Link may refuse or cancel bookings for illegal,
          hazardous, or misrepresented cargo.
        </Section>

        <Section title="6. Cancellations">
          Either party may cancel a booking before pickup. Repeated late cancellations may
          affect your ability to use the platform. Once goods are collected, cancellation
          terms are handled case by case through Support.
        </Section>

        <Section title="7. Liability">
          Van-Link facilitates the connection between clients and drivers but is not liable
          for loss, damage, or delay of goods in transit, except where required by Botswana
          law. Drivers are strongly encouraged to maintain appropriate goods-in-transit
          insurance. Disputes between clients and drivers should first be raised through
          in-app Support.
        </Section>

        <Section title="8. Ratings and conduct">
          Both clients and drivers may be rated after each completed booking. Abusive
          behaviour, fraud, or repeated policy violations may result in suspension or
          permanent removal from the platform.
        </Section>

        <Section title="9. Account suspension">
          We may suspend or terminate accounts that violate these Terms, provide false
          information, or pose a safety risk to other users.
        </Section>

        <Section title="10. Changes to these Terms">
          We may update these Terms from time to time. Continued use of Van-Link after an
          update constitutes acceptance of the revised Terms.
        </Section>

        <Section title="11. Contact">
          Questions about these Terms can be sent through the in-app Support page or to
          info@chekapay.co.bw.
        </Section>

        <p className="text-xs text-[#B08A45] pt-2">
          This is a general Terms of Use template for Van-Link's platform and does not
          constitute legal advice. We recommend having it reviewed by a Botswana-qualified
          attorney before relying on it for dispute resolution.
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p className="font-bold text-[#3D2B0E] mb-1.5">{title}</p>
      <p className="text-[#5A4322]">{children}</p>
    </div>
  );
}
