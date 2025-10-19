import { toImageUrl } from '../../../utils/imageUrl';

export const ProductPreview = (props: IProduct) => {
  return (
    <div className="animate-fadeIn relative rounded-xl drop-shadow-custom bg-white mb-8 group">
      <img
        className="w-full h-[250px] sm:h-[300px] rounded-xl object-cover"
        src={toImageUrl(props.image as string)}
        alt="Product image"
      />
      <div className="text-center py-4">
        <h5 className="font-semibold text-xl mb-1">{props.name}</h5>
        <h6 className="font-semibold mb-1">${props.price}</h6>
      </div>
    </div>
  );
};
