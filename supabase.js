import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://uyntgocoxdrzdqumlwfe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5bnRnb2NveGRyemRxdW1sd2ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNzczMDMsImV4cCI6MjA3MDc1MzMwM30.xWK9IeeJcWqp-gaDR2yO_hqscAsVgbJQ5sxTo2AUvfU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById('onboarding-form');
const submitBtn = document.getElementById('submit-btn');

const uploadFile = async (file) => {
    const filePath = `onboarding/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from('documents').upload(filePath, file);

    if (error) {
        throw error;
    }
    const { data: publicURL } = supabase.storage.from('documents').getPublicUrl(filePath);
    return publicURL.publicUrl;
};

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    let isValid = true;
    document.querySelectorAll('.error-message').forEach(el => el.textContent = "");
    
    // Simple client-side validation check
    const requiredFields = document.querySelectorAll('input[required]');
    requiredFields.forEach(field => {
        const errorElement = document.getElementById(`${field.id}-error`);
        if (!field.value) {
            isValid = false;
            errorElement.textContent = "This field is required.";
        }
    });

    if (!isValid) {
        return;
    }

    submitBtn.textContent = "Submitting...";
    submitBtn.disabled = true;

    try {
        // Sign in anonymously to get a session with 'authenticated' role
        const { data: { user }, error: authError } = await supabase.auth.signInAnonymously();
        if (authError) {
            throw authError;
        }

        const formData = new FormData(form);
        const panCardFile = formData.get('panCardUpload');
        const aadharCardFile = formData.get('aadharCardUpload');
        const chequeLeafFile = formData.get('chequeLeafUpload');

        const [panUrl, aadharUrl, chequeUrl] = await Promise.all([
            uploadFile(panCardFile),
            uploadFile(aadharCardFile),
            uploadFile(chequeLeafFile)
        ]);
        
        const { data, error } = await supabase
            .from('onboarding_data')
            .insert([{
                place_of_birth: formData.get('placeOfBirth'),
                mother_name: formData.get('motherName'),
                email: formData.get('email'),
                mobile: formData.get('mobile'),
                nominee_name: formData.get('nomineeName'),
                nominee_dob: formData.get('nomineeDob'),
                nominee_aadhar: formData.get('nomineeAadhar'),
                nominee_mobile: formData.get('nomineeMobile'),
                nominee_email: formData.get('nomineeEmail'),
                pan_card_url: panUrl,
                aadhar_card_url: aadharUrl,
                cheque_leaf_url: chequeUrl
            }]);

        if (error) {
            throw error;
        }
        
        alert('Form submitted successfully!');
        form.reset();
        document.querySelectorAll('.upload-box img').forEach(img => img.classList.add('hidden'));
        document.getElementById('pan-placeholder').classList.remove('hidden');
        document.getElementById('aadhar-placeholder').classList.remove('hidden');
        document.getElementById('cheque-placeholder').classList.remove('hidden');
        
    } catch (error) {
        console.error('Error submitting form:', error.message);
        alert('An error occurred during submission. Please try again.');
    } finally {
        submitBtn.textContent = "Submit";
        submitBtn.disabled = false;
    }
});