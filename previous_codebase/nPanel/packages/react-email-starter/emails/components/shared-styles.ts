export const emailStyles = {
  // Layout styles
  main: {
    backgroundColor: '#f6f9fc',
    padding: '10px 0',
  },

  container: {
    backgroundColor: '#ffffff',
    border: '1px solid #f0f0f0',
    padding: '45px',
  },

  // Typography styles
  text: {
    fontSize: '16px',
    fontFamily:
      "'Inter', 'Inter Sans Serif', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontWeight: '500',
    color: '#404040',
    lineHeight: '26px',
  },

  button: {
    backgroundColor: '#38b6ff',
    borderRadius: '4px',
    color: '#fff',
    fontFamily: "'Inter', 'Inter Sans Serif', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSize: '15px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block',
    width: '210px',
    padding: '14px 7px',
    margin: '0 auto',
  },

  anchor: {
    textDecoration: 'underline',
  },

  // Signature styles
  salutation: {
    fontSize: '16px',
    fontFamily:
      "'Inter', 'Inter Sans Serif', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontWeight: '500',
    color: '#404040',
    lineHeight: '26px',
    marginTop: '24px',
    marginBottom: '8px',
  },

  signature: {
    fontSize: '16px',
    fontFamily:
      "'Inter', 'Inter Sans Serif', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontWeight: '500',
    color: '#404040',
    lineHeight: '26px',
    marginBottom: '8px',
  },

  // Footer styles
  footerSection: {
    marginTop: '32px',
    paddingTop: '24px',
    borderTop: '1px solid #e5e7eb',
  },

  footerLeftColumn: {
    width: '50%',
    paddingRight: '40px',
  },

  footerRightColumn: {
    width: '50%',
    verticalAlign: 'bottom',
  },

  footerCompanyName: {
    fontSize: '16px',
    fontFamily:
      "'Inter', 'Inter Sans Serif', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontWeight: '600',
    color: '#111827',
    lineHeight: '24px',
    margin: '8px 0 4px 0',
  },

  footerTagline: {
    fontSize: '16px',
    fontFamily:
      "'Inter', 'Inter Sans Serif', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontWeight: '400',
    color: '#6b7280',
    lineHeight: '24px',
    margin: '4px 0 0 0',
  },

  socialRow: {
    height: '44px',
    width: '56px',
    verticalAlign: 'bottom',
    textAlign: 'left' as const,
  },

  socialColumn: {
    paddingRight: '8px',
  },

  footerAddress: {
    fontSize: '14px',
    fontFamily:
      "'Inter', 'Inter Sans Serif', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontWeight: '500',
    color: '#6b7280',
    lineHeight: '20px',
    margin: '0 0 8px 0',
    textAlign: 'left' as const,
  },

  footerContact: {
    fontSize: '14px',
    fontFamily:
      "'Inter', 'Inter Sans Serif', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontWeight: '500',
    color: '#6b7280',
    lineHeight: '20px',
    margin: '0 0 4px 0',
    textAlign: 'left' as const,
  },
};

// Company branding constants
export const companyBranding = {
  logo: {
    src: "https://res.cloudinary.com/df5ntv9gb/image/upload/v1758621603/Nisc_Logo_Original_im5pgk.png",
    alt: "Nisc Cloud Limited",
    width: "175",
    height: "50",
  },
  footerLogo: {
    src: "https://res.cloudinary.com/df5ntv9gb/image/upload/v1758621603/Nisc_Logo_Original_im5pgk.png",
    alt: "Nisc Cloud Limited",
    height: "42",
  },
  name: "Nisc Cloud Limited",
  tagline: "Transforming Businesses to stand out and succeed",
  website: "https://www.nisccloud.com",
  email: "info@nisccloud.com",
  phone: "+254 748 777 666",
  address: "Applewood Adams Suite 805 - Ngong Road, Nairobi, Kenya",
  socialLinks: {
    facebook: "https://www.facebook.com/nisccloud",
    twitter: "https://www.twitter.com/nisccloud",
    instagram: "https://www.instagram.com/nisccloud",
  },
};
