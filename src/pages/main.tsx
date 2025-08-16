import { useState } from 'react';
import { firestore } from '../firebase.config';
import { addDoc, collection } from 'firebase/firestore';
import { useAppSelector } from '../store/hooks';


export default function MainPage() {
  const [inputValue, setInputValue] = useState('');
  const user = useAppSelector((state) => state.reducer.user);

  const sendMessage = async () => {
    try {
      const docRef = await addDoc(collection(firestore, 'messages'), {
        uid: user?.uid,
        displayName: user?.displayName,
        photoURL: user?.photoURL,
        value: inputValue,
      });
      console.log("Document written with ID: ", docRef.id);
    } catch (e) {
      console.error("Error adding document: ", e);
    }

    setInputValue('');
  }

  return (
    <div>
      <div>
        sajhdfajkshfklh
      </div>
      <div>
        <input type="text" name="message" id="message" value={inputValue} onChange={e => setInputValue(e.target.value)}/>
        <button onClick={sendMessage}>Отправить</button>
      </div>
    </div>
  );
}
